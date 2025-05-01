# async-bmp280

[![Npm Package](https://img.shields.io/npm/v/async-bmp280.svg)](https://www.npmjs.com/package/async-bmp280) [![Dependencies](https://img.shields.io/david/AlejandroHerr/async-bmp280.svg?style=flat-square)](https://david-dm.org/alejandroherr/async-bmp280) [![Dev Dependencies](https://img.shields.io/david/dev/AlejandroHerr/async-bmp280.svg?style=flat-square)](https://david-dm.org/alejandroherr/async-bmp280?type=dev) ![CircleCI](https://img.shields.io/circleci/project/github/AlejandroHerr/async-bmp280/master.svg?style=flat-square&logo=circleci) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release) [![MIT License](https://img.shields.io/github/license/AlejandroHerr/async-bmp280.svg?style=flat-square)](https://github.com/AlejandroHerr/async-bmp280/blob/master/LICENSE.md)

JavaScript interface to control the temperature and pressure sensors [BMP280](https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BMP280-DS001.pdf), like the one used in the [Enviro pHat](https://pinout.xyz/pinout/enviro_phat). The `BMP280Interface` extends the `DeviceInterface` of [async-i2c-bus](https://github.com/AlejandroHerr/async-i2c-bus).

## Installation

To use this library you will also have to install [async-i2c-bus](https://github.com/AlejandroHerr/async-i2c-bus).

Yarn:

```bash
yarn add async-i2c-bus async-i2c-bus
```

or npm:

```bash
npm i -P async-i2c-bus async-i2c-bus
```

And you're ready to go.

### Requirements

The package requires node `v8.10.x` or higher.
If you need a compatibility with lower versions of node, you can build it. To do so clone the repo in your workspace, and modify the `target` options in the `tsconfig.json`, e.g:

```js
{
  "compilerOptions": {
    "target": "es5", // <-- Line changed
    "outDir": "dist/main",
    "rootDir": "src",
    // ..
  }
}
```

And build the module with `yarn build` or `npm run build`.

## Usage

The [`BMP280` factory](https://alejandroherr.github.io/async-bmp280/globals.html#bmp280) takes as argument an instance of the [`BusInterface`](https://alejandroherr.github.io/async-i2c-bus/interfaces/businterface.html) and returns an instance of the [`BMP280Interface`](https://alejandroherr.github.io/async-bmp280/interfaces/bmp280interface.html).

```javascript
function BMP280({ bus }: { bus: BusInterface }): BMP280Interface;
```

The `BMP280Interfaces` inherits from [`DeviceInterface`](https://alejandroherr.github.io/async-i2c-bus/interfaces/deviceinterface.html), hence all the low level methods such as `writeByte`, `readByte`,... are available to work with the device.

But it also offers some specific methods to work with the sensor.

### `init` and configuration

The `init` method performs a reset of the device, acquires temperature/pressure correction and configures the device with the values selected (if none present, it will use the default ones):

```javascript
init(params?: Partial<BMP280ControlMeasurement & BMP280Config>): Promise<BMP280Interface>;
```

The interfaces in the params are:

```javascript
interface BMP280ControlMeasurement {
  temperatureOversampling: BMP280Oversampling;
  pressureOversampling: BMP280Oversampling;
  mode: BMP280Mode;
}
interface BMP280Config {
  standbyTime: BMP280StandbyTime;
  iirFilter: BMP280IirFilter;
}

// Types:
type BMP280Oversampling = 'x0' | 'x1' | 'x2' | 'x4' | 'x8' | 'x16';
type BMP280Mode = 'SLEEP' | 'FORCED' | 'NORMAL';
type BMP280StandbyTime = '500us' | '62ms' | '125ms' | '250ms' | '500ms' | '1s' | '2s' | '4s';
type BMP280IirFilter = 'x0' | 'x1' | 'x2' | 'x4' | 'x8' | 'x16';
```

**This is the recommended way of initializing the sensor.**

If you don't use it, be sure to call `readTemperatureCorrection` and `readPressureCorrection` to be able to read the right temperature/pressure values.

Example of `init` vs no `init`

```javascript
import { Bus } from 'async-i2c-bus';
import { BMP280, REGISTERS, OFFSETS, OVERSAMPLING, MODE, STANDBY_TIME, IIR_FILTER } from 'async-i2c-bus';

// ...

const bus = Bus();
await bus.open();

const bmp280 = BMP280({ bus });

// init version
await bmp280.init();

// no-init version;

await bmp280.reset();
await bmp280.readTemperatureCorrection();
await bmp280.readPressureCorrection();

await bmp280.writeByte(
  REGISTERS.CTRL_MEAS,
  (OVERSAMPLING.x1 << OFFSETS.OSRS_T) | (OVERSAMPLING.x1 << OFFSETS.OSRS_P) | MODE.NORMAL,
);
await bmp280.writeByte(REGISTERS.CONFIG, (STANDBY_TIME['500us'] << OFFSETS.T_SB) | (IIR_FILTER.x16 << OFFSETS.FILTER));
```

After this step, the device is ready to `readTemperature` and to `readPressure`.

For more details, check the full auto-generated [documentation](https://alejandroherr.github.io/async-bmp280/) and get familiar with [BMP280 datasheet](https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BMP280-DS001.pdf).

### Read/write `config` and `ctrl_meas`

The module exports
There's two handy methods to read/write the registers `config` and `ctrl_meas`.

#### `write`

```javascript
writeControlMeasurement(controlMeasurement: Partial<BMP280ControlMeasurement>): Promise<BMP280Interface>
writeConfig(controlMeasurement: Partial<BMP280Config>): Promise<BMP280Interface>
```

Both functions will apply the values passed in the argument and apply them on the current value. That means that it is possible to change only one value or more in the register and leave the rest untouched.

```javascript
await bmp280.writeConfig({ iirFilter: 'x16' });

// it is equivalent as:

const currentValue = await bmp280.readByte(REGISTERS.config);
const nextValue = (currentValue ^ (MASKS.FILTER << OFFSETS.FILTER)) | (IIR_FILTER.x16 << OFFSETS.FILTER);
await bmp280.writeByte(REGISTERS.CONFIG, nextValue);
```

#### `read`

Read is the inverse function of the previous two functions:

```javascript
readControlMeasurement(): Promise<BMP280ControlMeasurement>
readConfig(): Promise<BMP280Config>
```

Example:

```javascript
await bmp280.writeConfig({ iirFilter: 'x16', standbyTime: '4s' });
await bmp280.readConfig(); // Returns { iirFilter: 'x16', standbyTime: '4s' }
```

### `readTemperature` and `readPressure`

```javascript
readTemperature(): Promise<number>
readPressure(): Promise<number>
```

Read temperature returns the celsius degrees.
Read pressure returns the pressure in Pascals.

### Constants

In case that you want or need to work with lower level method, the module exposes several constants to work with:

- [`REGISTERS`](https://alejandroherr.github.io/async-bmp280/globals.html#registers)
- [`MASKS`](https://alejandroherr.github.io/async-bmp280/globals.html#masks)
- [`OFFSETS`](https://alejandroherr.github.io/async-bmp280/globals.html#offsets)
- [`OVERSAMPLING`](https://alejandroherr.github.io/async-bmp280/globals.html#oversampling)
- [`MODE`](https://alejandroherr.github.io/async-bmp280/globals.html#mode)
- [`STANDBY_TIME`](https://alejandroherr.github.io/async-bmp280/globals.html#standby_time)
- [`IIR_FILTER`](https://alejandroherr.github.io/async-bmp280/globals.html#iir_filter)

Example:

```javascript
// ...
await bmp280.writeByte(
  REGISTERS.CTRL_MEAS,
  (OVERSAMPLING.x1 << OFFSETS.OSRS_T) | (OVERSAMPLING.x1 << OFFSETS.OSRS_P) | MODE.NORMAL,
);

const ctrlMeas = await bmp280.readByte(REGISTERS.CTRL_MEAS);
const temperatureOversampling = (ctrlMeas & MASKS.OSRS_T) >>> OFFSETS.OSRS_T;
```

### Full example of `NORMAL` (mode) usage

```javascript
import { Bus } from 'async-i2c-bus';
import { BMP280 } from 'async-i2c-bus';

const main = async () => {
  const busNumber = 1;
  const bus = Bus({ busNumber });

  await bus.open();

  const bmp280 = BMP280({ bus });

  await bmp280.init();

  let temperature = 0;
  let pressure = 0;

  /** Read temperature/pressure every second */
  while (1) {
    [temperature, pressure] = await Promise.all([bmp280.readTemperature(), bmp280.readPressure()]);

    console.log(`Temperature: ${temperature}°C`);
    console.log(`Pressure: ${pressure}Pa`);

    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }
};
```

### Example of `FORCED` (mode) usage

```javascript
import { Bus } from 'async-i2c-bus';
import { BMP280, IIR_FILTER, MODE, OVERSAMPLING } from 'async-i2c-bus';

const main = async () => {
  const busNumber = 1;
  const bus = Bus({ busNumber });

  await bus.open();

  const bmp280 = BMP280({ bus });

  // Use your values
  await bmp280.init({
    temperatureOversampling: OVERSAMPLING.x16,
    pressureOversampling: OVERSAMPLING.x16,
    mode: MODE.FORCED,
    iirFilter: IIR_FILTER.x0,
  });

  /** Read temperature/pressure once */
  const [temperature, pressure] = await Promise.all([bmp280.readTemperature(), bmp280.readPressure()]);

  console.log(`Temperature: ${temperature}°C`);
  console.log(`Pressure: ${pressure}Pa`);
};
```
