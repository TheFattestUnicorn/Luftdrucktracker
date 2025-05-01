import { DeviceInterface } from 'async-i2c-bus';

export type BMP280Oversampling = 'x0' | 'x1' | 'x2' | 'x4' | 'x8' | 'x16';
export type BMP280Mode = 'SLEEP' | 'FORCED' | 'NORMAL';
export type BMP280StandbyTime = '500us' | '62ms' | '125ms' | '250ms' | '500ms' | '1s' | '2s' | '4s';
export type BMP280IirFilter = 'x0' | 'x1' | 'x2' | 'x4' | 'x8' | 'x16';

export interface BMP280Status {
  measuring: boolean;
  imUpdate: boolean;
}

export interface BMP280ControlMeasurement {
  temperatureOversampling: BMP280Oversampling;
  pressureOversampling: BMP280Oversampling;
  mode: BMP280Mode;
}

export interface BMP280Config {
  standbyTime: BMP280StandbyTime;
  iirFilter: BMP280IirFilter;
}

export default interface BMP280Interface extends DeviceInterface {
  /**
   * Resets, reads temp/press correction and initializes the device with the params or default.
   * @throws DeviceError if device ID doesn't correspond with BMP280 id
   */
  init(params?: Partial<BMP280ControlMeasurement & BMP280Config>): Promise<BMP280Interface>;

  /**
   * Reads device ID
   */
  getId(): Promise<number>;

  /**
   * Resets device
   */
  reset(): Promise<BMP280Interface>;

  /**
   * Reads and parses STATUS register
   */
  readStatus(): Promise<BMP280Status>;

  /**
   * Reads and parses CTRL_MEAS register
   */
  readControlMeasurement(): Promise<BMP280ControlMeasurement>;
  /**
   * Writes CTRL_MEAS register
   */
  writeControlMeasurement(controlMeasurement: Partial<BMP280ControlMeasurement>): Promise<BMP280Interface>;

  /**
   * Reads and parses CONFIG register
   */
  readConfig(): Promise<BMP280Config>;
  /**
   * Writes CONFIG register
   */
  writeConfig(config: Partial<BMP280Config>): Promise<BMP280Interface>;

  /**
   * Reads and sets the temperature correction internally.
   * This function is called from init, you should not need to call it directly.
   */
  readTemperatureCorrection(): Promise<BMP280Interface>;
  /**
   * Reads and sets the pressure correction internally.
   * This function is called from init, you should not need to call it directly.
   */
  readPressureCorrection(): Promise<BMP280Interface>;

  /**
   * Reads temperature in celsius degrees
   */
  readTemperature(): Promise<number>;

  /**
   * Reads pressure in Pascals
   */
  readPressure(): Promise<number>;
}
