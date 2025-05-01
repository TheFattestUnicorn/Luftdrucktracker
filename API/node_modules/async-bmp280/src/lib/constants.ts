import { BMP280IirFilter, BMP280Mode, BMP280Oversampling, BMP280StandbyTime } from './BMP280Interface';

/**
 * Default address of the device
 */
export const ADDRESS = 0x77;

/**
 * Id of the device
 */
export const ID = 0x58;

export const REGISTERS = {
  TEMP_XLSB: 0xfc,
  TEMP_LSB: 0xfb,
  TEMP_MSB: 0xfa,
  TEMP: 0xfa,
  PRESS_XLSB: 0xf9,
  PRESS_LSB: 0xf8,
  PRESS_MSB: 0xf7,
  PRESS: 0xf7,
  CONFIG: 0xf5,
  CTRL_MEAS: 0xf4,
  STATUS: 0xf3,
  RESET: 0xe0,
  ID: 0xd0,
  TEMP_CORRECTION: 0x88,
  PRESS_CORRECTION: 0x8e,
};
export const OFFSETS = {
  // STATUS
  MEASURING: 3,
  IM_UPDATE: 0,

  // CTRL_MEAS
  OSRS_T: 5,
  OSRS_P: 2,
  MODE: 0,

  // CONFIG
  T_SB: 5,
  FILTER: 2,
};

export const MASKS = {
  // STATUS
  MEASURING: 0b1 << OFFSETS.MEASURING,
  IM_UPDATE: 0b1,

  // CTRL_MEAS
  OSRS_T: 0b111 << OFFSETS.OSRS_T,
  OSRS_P: 0b111 << OFFSETS.OSRS_P,
  MODE: 0b11,

  // CONFIG
  T_SB: 0b111 << OFFSETS.T_SB,
  FILTER: 0b111 << OFFSETS.FILTER,
};

/**
 * Values for OSRS_T and OSRS_P in the CTRL_MEAS register
 */
export const OVERSAMPLING: { [K in BMP280Oversampling]: number } = {
  x0: 0b000,
  x1: 0b001,
  x2: 0b010,
  x4: 0b011,
  x8: 0b100,
  x16: 0b111,
};

/**
 * Values for MODE in the CTRL_MEAS register
 */
export const MODE: { [K in BMP280Mode]: number } = {
  SLEEP: 0b00,
  FORCED: 0b01,
  NORMAL: 0b11,
};

/**
 * Values for T_SB in the CONFIG register
 */
export const STANDBY_TIME: { [K in BMP280StandbyTime]: number } = {
  '500us': 0b000,
  '62ms': 0b001,
  '125ms': 0b010,
  '250ms': 0b011,
  '500ms': 0b100,
  '1s': 0b101,
  '2s': 0b110,
  '4s': 0b111,
};

/**
 * Values for FILTER in the CONFIG register
 */
export const IIR_FILTER: { [K in BMP280IirFilter]: number } = {
  x0: 0b000,
  x1: 0b001,
  x2: 0b010,
  x4: 0b011,
  x8: 0b100,
  x16: 0b111,
};
