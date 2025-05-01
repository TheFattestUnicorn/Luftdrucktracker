import { BusInterface, Device, DeviceError } from 'async-i2c-bus';

import BMP280Interface, { BMP280Config, BMP280ControlMeasurement } from './BMP280Interface';
import { ADDRESS, ID, MASKS, OFFSETS, REGISTERS } from './constants';
import {
  calculatePressure,
  calculateTemperature,
  extractConfig,
  extractCtrlMeas,
  parseIirFilter,
  parseMode,
  parseOversampling,
  parseStandbyTime,
  readIirFilter,
  readMode,
  readOversampling,
  readStandbyTime,
} from './helpers';
import { extractValue } from './utils';

export default function BMP280({ address = ADDRESS, bus }: { address?: number; bus: BusInterface }): BMP280Interface {
  const temperatureCorrection = [0, 0, 0];
  const pressureCorrection = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  return {
    ...Device({ address, bus }),

    async init({
      temperatureOversampling = 'x1',
      pressureOversampling = 'x4',
      mode = 'NORMAL',
      standbyTime = '500us',
      iirFilter = 'x16',
    }: Partial<BMP280ControlMeasurement & BMP280Config> = {}) {
      const id = await this.getId();

      if (id !== ID) {
        throw new DeviceError('Id does not correspond with a BMP280', this.bus.busNumber, ADDRESS);
      }

      await this.reset();

      await Promise.all([this.readTemperatureCorrection(), this.readPressureCorrection()]);

      await this.writeControlMeasurement({
        temperatureOversampling,
        pressureOversampling,
        mode,
      });

      await this.writeConfig({
        standbyTime,
        iirFilter,
      });

      return this;
    },

    async getId() {
      return this.readByte(REGISTERS.ID);
    },

    async reset() {
      await this.writeByte(REGISTERS.RESET, 0xb6);

      return this;
    },

    async readStatus() {
      const status = await this.readByte(REGISTERS.STATUS);

      return {
        measuring: !!extractValue(status, MASKS.MEASURING, OFFSETS.MEASURING),
        imUpdate: !!extractValue(status, MASKS.IM_UPDATE, OFFSETS.IM_UPDATE),
      };
    },

    async readControlMeasurement() {
      const ctrlMeas = await this.readByte(REGISTERS.CTRL_MEAS);

      const { osrsT, osrsP, mode } = extractCtrlMeas(ctrlMeas);

      return {
        temperatureOversampling: readOversampling(osrsT),
        pressureOversampling: readOversampling(osrsP),
        mode: readMode(mode),
      };
    },
    async writeControlMeasurement(controlMeasurement: Partial<BMP280ControlMeasurement>) {
      const currentValue = await this.readByte(REGISTERS.CTRL_MEAS);

      const { osrsT: currentOsrsT, osrsP: currentOsrsP, mode: currentMode } = extractCtrlMeas(currentValue);

      const osrsT = parseOversampling(controlMeasurement.temperatureOversampling, currentOsrsT);
      const osrsP = parseOversampling(controlMeasurement.pressureOversampling, currentOsrsP);
      const mode = parseMode(controlMeasurement.mode, currentMode);

      await this.writeByte(
        REGISTERS.CTRL_MEAS,
        (osrsT << OFFSETS.OSRS_T) | (osrsP << OFFSETS.OSRS_P) | (mode << OFFSETS.MODE),
      );

      return this;
    },

    async readConfig() {
      const config = await this.readByte(REGISTERS.CONFIG);

      const { tSb, filter } = extractConfig(config);

      return {
        standbyTime: readStandbyTime(tSb),
        iirFilter: readIirFilter(filter),
      };
    },
    async writeConfig(config: Partial<BMP280Config>) {
      const currentValue = await this.readByte(REGISTERS.CONFIG);

      const { tSb: currentTsB, filter: currentFilter } = extractConfig(currentValue);

      const tSb = parseStandbyTime(config.standbyTime, currentTsB);
      const filter = parseIirFilter(config.iirFilter, currentFilter);

      await this.writeByte(REGISTERS.CONFIG, (tSb << OFFSETS.T_SB) | (filter << OFFSETS.FILTER));

      return this;
    },

    async readTemperatureCorrection() {
      const buffer = Buffer.alloc(6);

      await this.readI2cBlock(REGISTERS.TEMP_CORRECTION, 6, buffer);

      temperatureCorrection[0] = buffer.readUInt16LE(0);
      temperatureCorrection[1] = buffer.readInt16LE(2);
      temperatureCorrection[2] = buffer.readInt16LE(4);

      return this;
    },

    async readPressureCorrection() {
      const buffer = Buffer.alloc(18);

      await this.readI2cBlock(REGISTERS.PRESS_CORRECTION, 18, buffer);

      pressureCorrection[0] = buffer.readUInt16LE(0);
      pressureCorrection[1] = buffer.readInt16LE(2);
      pressureCorrection[2] = buffer.readInt16LE(4);
      pressureCorrection[3] = buffer.readInt16LE(6);
      pressureCorrection[4] = buffer.readInt16LE(8);
      pressureCorrection[5] = buffer.readInt16LE(10);
      pressureCorrection[6] = buffer.readInt16LE(12);
      pressureCorrection[7] = buffer.readInt16LE(14);
      pressureCorrection[8] = buffer.readInt16LE(16);

      return this;
    },

    async readTemperature() {
      const buffer = Buffer.alloc(3);

      await this.readI2cBlock(REGISTERS.TEMP, 3, buffer);

      const temperature = calculateTemperature(buffer.readUIntBE(0, 3) >>> 4, temperatureCorrection);

      return temperature / 5120;
    },

    async readPressure() {
      const tempBuffer = Buffer.alloc(3);
      const pressBuffer = Buffer.alloc(3);

      await Promise.all([
        this.readI2cBlock(REGISTERS.TEMP, 3, tempBuffer),
        this.readI2cBlock(REGISTERS.PRESS, 3, pressBuffer),
      ]);

      const temperature = calculateTemperature(tempBuffer.readUIntBE(0, 3) >>> 4, temperatureCorrection);

      return calculatePressure(pressBuffer.readUIntBE(0, 3) >>> 4, temperature, pressureCorrection);
    },
  };
}
