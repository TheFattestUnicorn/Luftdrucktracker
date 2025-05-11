const { Bus } = require('async-i2c-bus');
const { BMP280 } = require('async-bmp280'); // Import BMP280 from the correct package

const main = async () => {
  const busNumber = 1;
  const bus = new Bus({ busNumber });

  await bus.open();

  const bmp280 = BMP280({ bus: bus, address: 0x76 }); // Explicitly set the address to 0x76

  await bmp280.init();

  let temperature = 0;
  let pressure = 0;

  /** Read temperature/pressure every second */
  while (true) {
    [temperature, pressure] = await Promise.all([bmp280.readTemperature(), bmp280.readPressure()]);

    console.log(`Temperature: ${temperature}°C`);
    console.log(`Pressure: ${pressure} Pa`);

    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }
};

main().catch(err => {
  console.error("Error:", err);
});
