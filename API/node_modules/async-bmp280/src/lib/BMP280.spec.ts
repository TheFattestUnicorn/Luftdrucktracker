import { Bus, BusInterface, DeviceError } from 'async-i2c-bus';

import BMP280 from './BMP280';
import { ADDRESS, OFFSETS, REGISTERS } from './constants';

jest.mock('i2c-bus', () => {
  // tslint:disable-next-line:no-submodule-imports
  const createI2cBusMock = require('async-i2c-bus/dist/main/lib/createI2cBusMock').default; // eslint-disable-line global-require

  const { ADDRESS: BMP280_ADDRESS, ID: BMP280_ID, REGISTERS: BMP280_REGISTERS } = require('./constants');

  const buffer = Buffer.alloc(0xff, 0);

  buffer[BMP280_REGISTERS.ID] = BMP280_ID;

  return {
    open: createI2cBusMock({
      devices: {
        [BMP280_ADDRESS]: buffer,
      },
    }),
  };
});

let bus: BusInterface | null = null;

const setup = () => ({
  bmp280: BMP280({ bus }),
});

beforeAll(async () => {
  bus = Bus({ busNumber: 1 });

  await bus.open();
});

afterEach(async () => {
  await Promise.all([
    bus.writeByte(ADDRESS, REGISTERS.STATUS, 0x00),
    bus.writeByte(ADDRESS, REGISTERS.CTRL_MEAS, 0x00),
    bus.writeByte(ADDRESS, REGISTERS.CONFIG, 0x00),
  ]);
});

describe('BMP280', () => {
  describe('init', () => {
    it('should initialize device with default values', async () => {
      const { bmp280 } = setup();
      const writeControlMeasurementSpy = jest.spyOn(bmp280, 'writeControlMeasurement');
      const writeConfigSpy = jest.spyOn(bmp280, 'writeConfig');

      await bmp280.init();

      expect(writeControlMeasurementSpy).toHaveBeenCalledWith({
        temperatureOversampling: 'x1',
        pressureOversampling: 'x4',
        mode: 'NORMAL',
      });
      expect(writeConfigSpy).toHaveBeenCalledWith({
        standbyTime: '500us',
        iirFilter: 'x16',
      });
    });
    it('should initialize device', async () => {
      const { bmp280 } = setup();
      const resetSpy = jest.spyOn(bmp280, 'reset');
      const readTemperatureCorrectionSpy = jest.spyOn(bmp280, 'readTemperatureCorrection');
      const readPressureCorrectionSpy = jest.spyOn(bmp280, 'readPressureCorrection');
      const writeControlMeasurementSpy = jest.spyOn(bmp280, 'writeControlMeasurement');
      const writeConfigSpy = jest.spyOn(bmp280, 'writeConfig');

      await bmp280.init({
        temperatureOversampling: 'x4',
        pressureOversampling: 'x8',
        mode: 'FORCED',
        standbyTime: '500ms',
        iirFilter: 'x4',
      });

      expect(resetSpy).toHaveBeenCalled();
      expect(readTemperatureCorrectionSpy).toHaveBeenCalled();
      expect(readPressureCorrectionSpy).toHaveBeenCalled();
      expect(writeControlMeasurementSpy).toHaveBeenCalledWith({
        temperatureOversampling: 'x4',
        pressureOversampling: 'x8',
        mode: 'FORCED',
      });
      expect(writeConfigSpy).toHaveBeenCalledWith({
        standbyTime: '500ms',
        iirFilter: 'x4',
      });
    });
    it('should throw an error if id does not correspond to device', async () => {
      const { bmp280 } = setup();

      await bmp280.writeByte(REGISTERS.ID, 0x00);

      expect(bmp280.init()).rejects.toEqual(new DeviceError('Id does not correspond with a BMP280', 1, ADDRESS));
    });
  });
  describe('reset', () => {
    it('should write reset value', async () => {
      const { bmp280 } = setup();
      const writeByteSpy = jest.spyOn(bmp280, 'writeByte');

      await bmp280.reset();

      expect(writeByteSpy).toHaveBeenCalledWith(REGISTERS.RESET, 0xb6);
    });
  });
  describe('readStatus', () => {
    it('should read status', async () => {
      const { bmp280 } = setup();

      let status = await bmp280.readStatus();

      expect(status).toEqual({
        measuring: false,
        imUpdate: false,
      });

      await bus.writeByte(ADDRESS, REGISTERS.STATUS, (0b1 << OFFSETS.MEASURING) | (0b1 << OFFSETS.IM_UPDATE));

      status = await bmp280.readStatus();

      expect(status).toEqual({
        measuring: true,
        imUpdate: true,
      });
    });
  });
  describe('read/write Control Measurement', () => {
    it('should write control measurement keeping current values', async () => {
      const { bmp280 } = setup();

      const writeByteSpy = jest.spyOn(bmp280, 'writeByte');

      await bmp280.writeControlMeasurement({
        temperatureOversampling: 'x8',
      });

      expect(writeByteSpy).toHaveBeenLastCalledWith(REGISTERS.CTRL_MEAS, 0b10000000);
      expect(bmp280.readByte(REGISTERS.CTRL_MEAS)).resolves.toBe(0b10000000);

      await bmp280.writeControlMeasurement({
        pressureOversampling: 'x4',
      });

      expect(writeByteSpy).toHaveBeenLastCalledWith(REGISTERS.CTRL_MEAS, 0b10001100);
      expect(bmp280.readByte(REGISTERS.CTRL_MEAS)).resolves.toBe(0b10001100);

      await bmp280.writeControlMeasurement({
        mode: 'FORCED',
      });

      expect(writeByteSpy).toHaveBeenLastCalledWith(REGISTERS.CTRL_MEAS, 0b10001101);
      expect(bmp280.readByte(REGISTERS.CTRL_MEAS)).resolves.toBe(0b10001101);

      await bmp280.writeControlMeasurement({
        temperatureOversampling: 'x16',
        pressureOversampling: 'x16',
        mode: 'NORMAL',
      });

      expect(writeByteSpy).toHaveBeenLastCalledWith(REGISTERS.CTRL_MEAS, 0b11111111);
      expect(bmp280.readByte(REGISTERS.CTRL_MEAS)).resolves.toBe(0b11111111);
    });
    it('should read and parse the config register', async () => {
      const { bmp280 } = setup();

      let controlMeasurement = await bmp280.readControlMeasurement();

      expect(controlMeasurement.temperatureOversampling).toBe('x0');
      expect(controlMeasurement.pressureOversampling).toBe('x0');
      expect(controlMeasurement.mode).toBe('SLEEP');

      await bmp280.writeByte(REGISTERS.CTRL_MEAS, 0b10000000);

      controlMeasurement = await bmp280.readControlMeasurement();

      expect(controlMeasurement.temperatureOversampling).toBe('x8');
      expect(controlMeasurement.pressureOversampling).toBe('x0');
      expect(controlMeasurement.mode).toBe('SLEEP');

      await bmp280.writeByte(REGISTERS.CTRL_MEAS, 0b11111111);

      controlMeasurement = await bmp280.readControlMeasurement();

      expect(controlMeasurement.temperatureOversampling).toBe('x16');
      expect(controlMeasurement.pressureOversampling).toBe('x16');
      expect(controlMeasurement.mode).toBe('NORMAL');
    });
  });
  describe('read/write Config', () => {
    it('should write the config register keeping current values', async () => {
      const { bmp280 } = setup();

      const writeByteSpy = jest.spyOn(bmp280, 'writeByte');

      await bmp280.writeConfig({
        standbyTime: '250ms',
      });

      expect(writeByteSpy).toHaveBeenLastCalledWith(REGISTERS.CONFIG, 0b01100000);
      expect(bmp280.readByte(REGISTERS.CONFIG)).resolves.toBe(0b01100000);

      await bmp280.writeConfig({
        iirFilter: 'x4',
      });

      expect(writeByteSpy).toHaveBeenLastCalledWith(REGISTERS.CONFIG, 0b01101100);
      expect(bmp280.readByte(REGISTERS.CONFIG)).resolves.toBe(0b01101100);

      await bmp280.writeConfig({
        standbyTime: '4s',
        iirFilter: 'x16',
      });

      expect(writeByteSpy).toHaveBeenLastCalledWith(REGISTERS.CONFIG, 0b11111100);
      expect(bmp280.readByte(REGISTERS.CONFIG)).resolves.toBe(0b11111100);
    });
    it('should write and parse the config register', async () => {
      const { bmp280 } = setup();

      let config = await bmp280.readConfig();

      expect(config.standbyTime).toBe('500us');
      expect(config.iirFilter).toBe('x0');

      await bmp280.writeByte(REGISTERS.CONFIG, 0b01100000);

      config = await bmp280.readConfig();

      expect(config.standbyTime).toBe('250ms');
      expect(config.iirFilter).toBe('x0');

      await bmp280.writeByte(REGISTERS.CONFIG, 0b01101100);

      config = await bmp280.readConfig();

      expect(config.standbyTime).toBe('250ms');
      expect(config.iirFilter).toBe('x4');

      await bmp280.writeByte(REGISTERS.CONFIG, 0b11111100);

      config = await bmp280.readConfig();

      expect(config.standbyTime).toBe('4s');
      expect(config.iirFilter).toBe('x16');
    });
  });
  describe('readTemperatureCorrection', () => {
    it('should read temperature correction', async () => {
      const { bmp280 } = setup();
      const readI2cBlockSpy = jest.spyOn(bmp280, 'readI2cBlock');

      await bmp280.readTemperatureCorrection();

      expect(readI2cBlockSpy).toHaveBeenCalledTimes(1);
      expect(readI2cBlockSpy).toHaveBeenCalledWith(REGISTERS.TEMP_CORRECTION, 6, Buffer.alloc(6, 0));
    });
  });
  describe('readPressureCorrection', () => {
    it('should read pressure correction', async () => {
      const { bmp280 } = setup();
      const readI2cBlockSpy = jest.spyOn(bmp280, 'readI2cBlock');

      await bmp280.readPressureCorrection();

      expect(readI2cBlockSpy).toHaveBeenCalledTimes(1);
      expect(readI2cBlockSpy).toHaveBeenCalledWith(REGISTERS.PRESS_CORRECTION, 18, Buffer.alloc(18, 0));
    });
  });
  describe('readTemperature', () => {
    it('should read temperature', async () => {
      const { bmp280 } = setup();
      const readI2cBlockSpy = jest.spyOn(bmp280, 'readI2cBlock');

      await bmp280.readTemperature();

      expect(readI2cBlockSpy).toHaveBeenCalledTimes(1);
      expect(readI2cBlockSpy).toHaveBeenCalledWith(REGISTERS.TEMP, 3, Buffer.alloc(3, 0));
    });
  });
  describe('readPressure', () => {
    it('should read pressure', async () => {
      const { bmp280 } = setup();
      const readI2cBlockSpy = jest.spyOn(bmp280, 'readI2cBlock');

      await bmp280.readPressure();

      expect(readI2cBlockSpy).toHaveBeenCalledTimes(2);
      expect(readI2cBlockSpy).toHaveBeenNthCalledWith(1, REGISTERS.TEMP, 3, Buffer.alloc(3, 0));
      expect(readI2cBlockSpy).toHaveBeenNthCalledWith(2, REGISTERS.PRESS, 3, Buffer.alloc(3, 0));
    });
  });
});
