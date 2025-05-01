import { calculatePressure, calculateTemperature } from './helpers';

describe('BMP280/utils/calculators', () => {
  /**
   * Values taken from datasheet
   */
  const rawTemperature = 519888;
  const rawPressure = 415148;
  const temperatureCorrection = [27504, 26435, -1000];
  const pressureCorrection = [36447, -10685, 3024, 2855, 140, -7, 15500, -14600, 6000];

  const datasheetTemperature = 25.082;
  const datasheetPressure = 100737;

  describe('calculateTemperature', () => {
    it('should return the right register value for powers of two between 0 and 16', () => {
      const fineTemperature = Math.round(calculateTemperature(rawTemperature, temperatureCorrection));

      const temperature = Math.round((fineTemperature / 5120) * 1000) / 1000;

      expect(temperature).toBe(datasheetTemperature);
    });
  });
  describe('calculatePressure', () => {
    it('should return the right register value for powers of two between 0 and 16', () => {
      const fineTemperature = calculateTemperature(rawTemperature, temperatureCorrection);

      const pressure = Math.round(calculatePressure(rawPressure, fineTemperature, pressureCorrection));

      expect(pressure).toBe(datasheetPressure);
    });
  });
});
