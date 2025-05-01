import BMP280 from './lib/BMP280';
import BMP280Interface, {
  BMP280Config,
  BMP280ControlMeasurement,
  BMP280IirFilter,
  BMP280Mode,
  BMP280Oversampling,
  BMP280StandbyTime,
  BMP280Status,
} from './lib/BMP280Interface';
import { ADDRESS, ID, IIR_FILTER, MASKS, MODE, OFFSETS, OVERSAMPLING, REGISTERS, STANDBY_TIME } from './lib/constants';

export {
  BMP280,
  BMP280Config,
  BMP280ControlMeasurement,
  BMP280IirFilter,
  BMP280Interface,
  BMP280Mode,
  BMP280Oversampling,
  BMP280StandbyTime,
  BMP280Status,
  ADDRESS,
  ID,
  IIR_FILTER,
  MASKS,
  MODE,
  OFFSETS,
  OVERSAMPLING,
  REGISTERS,
  STANDBY_TIME,
};
