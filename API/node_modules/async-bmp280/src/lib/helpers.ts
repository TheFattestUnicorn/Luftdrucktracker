import { BMP280IirFilter, BMP280Mode, BMP280Oversampling, BMP280StandbyTime } from './BMP280Interface';
import { IIR_FILTER, MASKS, MODE, OFFSETS, OVERSAMPLING, STANDBY_TIME } from './constants';
import { extractValue, lookUp, reverseLookUp } from './utils';

/**
 * @hidden
 */
export const extractCtrlMeas = (value: number) => ({
  osrsT: extractValue(value, MASKS.OSRS_T, OFFSETS.OSRS_T),
  osrsP: extractValue(value, MASKS.OSRS_P, OFFSETS.OSRS_P),
  mode: extractValue(value, MASKS.MODE, OFFSETS.MODE),
});

/**
 * @hidden
 */
export const extractConfig = (value: number) => ({
  tSb: extractValue(value, MASKS.T_SB, OFFSETS.T_SB),
  filter: extractValue(value, MASKS.FILTER, OFFSETS.FILTER),
});

/**
 * @hidden
 */
export const parseOversampling = lookUp<BMP280Oversampling>(OVERSAMPLING);
/**
 * @hidden
 */
export const readOversampling = reverseLookUp<BMP280Oversampling>(OVERSAMPLING);

/**
 * @hidden
 */
export const parseMode = lookUp<BMP280Mode>(MODE);
/**
 * @hidden
 */
export const readMode = reverseLookUp<BMP280Mode>(MODE);

/**
 * @hidden
 */
export const parseStandbyTime = lookUp<BMP280StandbyTime>(STANDBY_TIME);
/**
 * @hidden
 */
export const readStandbyTime = reverseLookUp<BMP280StandbyTime>(STANDBY_TIME);

/**
 * @hidden
 */
export const parseIirFilter = lookUp<BMP280IirFilter>(IIR_FILTER);
/**
 * @hidden
 */
export const readIirFilter = reverseLookUp<BMP280IirFilter>(IIR_FILTER);

/**
 * @hidden
 */
export const calculateTemperature = (rawTemperature: number, correction: number[]): number => {
  const var1 = (rawTemperature / 16384 - correction[0] / 1024) * correction[1];
  const var2 = Math.pow(rawTemperature / 131072 - correction[0] / 8192, 2) * correction[2];

  return var1 + var2;
};

/**
 * @hidden
 */
export const calculatePressure = (rawPressure: number, temperatureFine: number, correction: number[]): number => {
  let var1 = temperatureFine / 2 - 64000;
  let var2 = var1 * (var1 * (correction[5] / 32768) + correction[4] * 2);

  var2 = var2 / 4 + correction[3] * 65536;
  var1 = ((correction[2] * var1 * var1) / 524288 + correction[1] * var1) / 524288;
  var1 = (1 + var1 / 32768) * correction[0];

  if (var1 === 0) {
    return 0;
  }

  let var3 = 1048576 - rawPressure;
  var3 = (var3 - var2 / 4096) * (6250 / var1);
  var1 = correction[8] * ((var3 * var3) / 2147483648);
  var2 = (var3 * correction[7]) / 32768;

  return var3 + (var1 + var2 + correction[6]) / 16;
};
