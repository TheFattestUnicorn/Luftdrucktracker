
async-bmp280
============

[![Npm Package](https://img.shields.io/npm/v/async-bmp280.svg)](https://www.npmjs.com/package/async-bmp280) [![Dependencies](https://img.shields.io/david/AlejandroHerr/async-bmp280.svg?style=flat-square)](https://david-dm.org/alejandroherr/async-bmp280) [![Dev Dependencies](https://img.shields.io/david/dev/AlejandroHerr/async-bmp280.svg?style=flat-square)](https://david-dm.org/alejandroherr/async-bmp280?type=dev) ![CircleCI](https://img.shields.io/circleci/project/github/AlejandroHerr/async-bmp280/master.svg?style=flat-square&logo=circleci) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release) [![MIT License](https://img.shields.io/github/license/AlejandroHerr/async-bmp280.svg?style=flat-square)](https://github.com/AlejandroHerr/async-bmp280/blob/master/LICENSE.md)

JavaScript interface to control the temperature and pressure sensors [BMP280](https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BMP280-DS001.pdf), like the one used in the [Enviro pHat](https://pinout.xyz/pinout/enviro_phat). The `BMP280Interface` extends the `DeviceInterface` of [async-i2c-bus](https://github.com/AlejandroHerr/async-i2c-bus).

Installation
------------

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

The package requires node `v8.10.x` or higher. If you need a compatibility with lower versions of node, you can build it. To do so clone the repo in your workspace, and modify the `target` options in the `tsconfig.json`, e.g:

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

Usage
-----

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

The module exports There's two handy methods to read/write the registers `config` and `ctrl_meas`.

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

Read temperature returns the celsius degrees. Read pressure returns the pressure in Pascals.

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

## Index

### Interfaces

* [BMP280Config](interfaces/bmp280config.md)
* [BMP280ControlMeasurement](interfaces/bmp280controlmeasurement.md)
* [BMP280Interface](interfaces/bmp280interface.md)
* [BMP280Status](interfaces/bmp280status.md)

### Type aliases

* [BMP280IirFilter](#bmp280iirfilter)
* [BMP280Mode](#bmp280mode)
* [BMP280Oversampling](#bmp280oversampling)
* [BMP280StandbyTime](#bmp280standbytime)

### Variables

* [ADDRESS](#address)
* [ID](#id)

### Functions

* [BMP280](#bmp280)

### Object literals

* [IIR_FILTER](#iir_filter)
* [MASKS](#masks)
* [MODE](#mode)
* [OFFSETS](#offsets)
* [OVERSAMPLING](#oversampling)
* [REGISTERS](#registers)
* [STANDBY_TIME](#standby_time)

---

## Type aliases

<a id="bmp280iirfilter"></a>

###  BMP280IirFilter

**Ƭ BMP280IirFilter**: *"x0" | "x1" | "x2" | "x4" | "x8" | "x16"*

*Defined in [BMP280Interface.ts:6](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L6)*

___
<a id="bmp280mode"></a>

###  BMP280Mode

**Ƭ BMP280Mode**: *"SLEEP" | "FORCED" | "NORMAL"*

*Defined in [BMP280Interface.ts:4](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L4)*

___
<a id="bmp280oversampling"></a>

###  BMP280Oversampling

**Ƭ BMP280Oversampling**: *"x0" | "x1" | "x2" | "x4" | "x8" | "x16"*

*Defined in [BMP280Interface.ts:3](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L3)*

___
<a id="bmp280standbytime"></a>

###  BMP280StandbyTime

**Ƭ BMP280StandbyTime**: *"500us" | "62ms" | "125ms" | "250ms" | "500ms" | "1s" | "2s" | "4s"*

*Defined in [BMP280Interface.ts:5](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L5)*

___

## Variables

<a id="address"></a>

### `<Const>` ADDRESS

**● ADDRESS**: *`119`* = 119

*Defined in [constants.ts:6](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L6)*

Default address of the device

___
<a id="id"></a>

### `<Const>` ID

**● ID**: *`88`* = 88

*Defined in [constants.ts:11](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L11)*

Id of the device

___

## Functions

<a id="bmp280"></a>

###  BMP280

▸ **BMP280**(__namedParameters: *`object`*): [BMP280Interface](interfaces/bmp280interface.md)

*Defined in [BMP280.ts:21](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280.ts#L21)*

**Parameters:**

**__namedParameters: `object`**

| Name | Type | Default value |
| ------ | ------ | ------ |
| address | `number` |  ADDRESS |
| bus | `BusInterface` | - |

**Returns:** [BMP280Interface](interfaces/bmp280interface.md)

___

## Object literals

<a id="iir_filter"></a>

### `<Const>` IIR_FILTER

**IIR_FILTER**: *`object`*

*Defined in [constants.ts:98](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L98)*

Values for FILTER in the CONFIG register

<a id="iir_filter.x0"></a>

####  x0

**● x0**: *`number`* = 0

*Defined in [constants.ts:99](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L99)*

___
<a id="iir_filter.x1"></a>

####  x1

**● x1**: *`number`* = 1

*Defined in [constants.ts:100](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L100)*

___
<a id="iir_filter.x16"></a>

####  x16

**● x16**: *`number`* = 7

*Defined in [constants.ts:104](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L104)*

___
<a id="iir_filter.x2"></a>

####  x2

**● x2**: *`number`* = 2

*Defined in [constants.ts:101](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L101)*

___
<a id="iir_filter.x4"></a>

####  x4

**● x4**: *`number`* = 3

*Defined in [constants.ts:102](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L102)*

___
<a id="iir_filter.x8"></a>

####  x8

**● x8**: *`number`* = 4

*Defined in [constants.ts:103](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L103)*

___

___
<a id="masks"></a>

### `<Const>` MASKS

**MASKS**: *`object`*

*Defined in [constants.ts:45](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L45)*

<a id="masks.filter"></a>

####  FILTER

**● FILTER**: *`number`* =  0b111 << OFFSETS.FILTER

*Defined in [constants.ts:57](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L57)*

___
<a id="masks.im_update"></a>

####  IM_UPDATE

**● IM_UPDATE**: *`number`* = 1

*Defined in [constants.ts:48](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L48)*

___
<a id="masks.measuring"></a>

####  MEASURING

**● MEASURING**: *`number`* =  0b1 << OFFSETS.MEASURING

*Defined in [constants.ts:47](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L47)*

___
<a id="masks.mode"></a>

####  MODE

**● MODE**: *`number`* = 3

*Defined in [constants.ts:53](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L53)*

___
<a id="masks.osrs_p"></a>

####  OSRS_P

**● OSRS_P**: *`number`* =  0b111 << OFFSETS.OSRS_P

*Defined in [constants.ts:52](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L52)*

___
<a id="masks.osrs_t"></a>

####  OSRS_T

**● OSRS_T**: *`number`* =  0b111 << OFFSETS.OSRS_T

*Defined in [constants.ts:51](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L51)*

___
<a id="masks.t_sb"></a>

####  T_SB

**● T_SB**: *`number`* =  0b111 << OFFSETS.T_SB

*Defined in [constants.ts:56](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L56)*

___

___
<a id="mode"></a>

### `<Const>` MODE

**MODE**: *`object`*

*Defined in [constants.ts:75](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L75)*

Values for MODE in the CTRL\_MEAS register

<a id="mode.forced"></a>

####  FORCED

**● FORCED**: *`number`* = 1

*Defined in [constants.ts:77](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L77)*

___
<a id="mode.normal"></a>

####  NORMAL

**● NORMAL**: *`number`* = 3

*Defined in [constants.ts:78](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L78)*

___
<a id="mode.sleep"></a>

####  SLEEP

**● SLEEP**: *`number`* = 0

*Defined in [constants.ts:76](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L76)*

___

___
<a id="offsets"></a>

### `<Const>` OFFSETS

**OFFSETS**: *`object`*

*Defined in [constants.ts:30](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L30)*

<a id="offsets.filter"></a>

####  FILTER

**● FILTER**: *`number`* = 2

*Defined in [constants.ts:42](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L42)*

___
<a id="offsets.im_update"></a>

####  IM_UPDATE

**● IM_UPDATE**: *`number`* = 0

*Defined in [constants.ts:33](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L33)*

___
<a id="offsets.measuring"></a>

####  MEASURING

**● MEASURING**: *`number`* = 3

*Defined in [constants.ts:32](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L32)*

___
<a id="offsets.mode"></a>

####  MODE

**● MODE**: *`number`* = 0

*Defined in [constants.ts:38](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L38)*

___
<a id="offsets.osrs_p"></a>

####  OSRS_P

**● OSRS_P**: *`number`* = 2

*Defined in [constants.ts:37](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L37)*

___
<a id="offsets.osrs_t"></a>

####  OSRS_T

**● OSRS_T**: *`number`* = 5

*Defined in [constants.ts:36](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L36)*

___
<a id="offsets.t_sb"></a>

####  T_SB

**● T_SB**: *`number`* = 5

*Defined in [constants.ts:41](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L41)*

___

___
<a id="oversampling"></a>

### `<Const>` OVERSAMPLING

**OVERSAMPLING**: *`object`*

*Defined in [constants.ts:63](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L63)*

Values for OSRS\_T and OSRS\_P in the CTRL\_MEAS register

<a id="oversampling.x0"></a>

####  x0

**● x0**: *`number`* = 0

*Defined in [constants.ts:64](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L64)*

___
<a id="oversampling.x1"></a>

####  x1

**● x1**: *`number`* = 1

*Defined in [constants.ts:65](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L65)*

___
<a id="oversampling.x16"></a>

####  x16

**● x16**: *`number`* = 7

*Defined in [constants.ts:69](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L69)*

___
<a id="oversampling.x2"></a>

####  x2

**● x2**: *`number`* = 2

*Defined in [constants.ts:66](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L66)*

___
<a id="oversampling.x4"></a>

####  x4

**● x4**: *`number`* = 3

*Defined in [constants.ts:67](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L67)*

___
<a id="oversampling.x8"></a>

####  x8

**● x8**: *`number`* = 4

*Defined in [constants.ts:68](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L68)*

___

___
<a id="registers"></a>

### `<Const>` REGISTERS

**REGISTERS**: *`object`*

*Defined in [constants.ts:13](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L13)*

<a id="registers.config"></a>

####  CONFIG

**● CONFIG**: *`number`* = 245

*Defined in [constants.ts:22](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L22)*

___
<a id="registers.ctrl_meas"></a>

####  CTRL_MEAS

**● CTRL_MEAS**: *`number`* = 244

*Defined in [constants.ts:23](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L23)*

___
<a id="registers.id"></a>

####  ID

**● ID**: *`number`* = 208

*Defined in [constants.ts:26](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L26)*

___
<a id="registers.press"></a>

####  PRESS

**● PRESS**: *`number`* = 247

*Defined in [constants.ts:21](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L21)*

___
<a id="registers.press_correction"></a>

####  PRESS_CORRECTION

**● PRESS_CORRECTION**: *`number`* = 142

*Defined in [constants.ts:28](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L28)*

___
<a id="registers.press_lsb"></a>

####  PRESS_LSB

**● PRESS_LSB**: *`number`* = 248

*Defined in [constants.ts:19](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L19)*

___
<a id="registers.press_msb"></a>

####  PRESS_MSB

**● PRESS_MSB**: *`number`* = 247

*Defined in [constants.ts:20](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L20)*

___
<a id="registers.press_xlsb"></a>

####  PRESS_XLSB

**● PRESS_XLSB**: *`number`* = 249

*Defined in [constants.ts:18](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L18)*

___
<a id="registers.reset"></a>

####  RESET

**● RESET**: *`number`* = 224

*Defined in [constants.ts:25](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L25)*

___
<a id="registers.status"></a>

####  STATUS

**● STATUS**: *`number`* = 243

*Defined in [constants.ts:24](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L24)*

___
<a id="registers.temp"></a>

####  TEMP

**● TEMP**: *`number`* = 250

*Defined in [constants.ts:17](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L17)*

___
<a id="registers.temp_correction"></a>

####  TEMP_CORRECTION

**● TEMP_CORRECTION**: *`number`* = 136

*Defined in [constants.ts:27](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L27)*

___
<a id="registers.temp_lsb"></a>

####  TEMP_LSB

**● TEMP_LSB**: *`number`* = 251

*Defined in [constants.ts:15](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L15)*

___
<a id="registers.temp_msb"></a>

####  TEMP_MSB

**● TEMP_MSB**: *`number`* = 250

*Defined in [constants.ts:16](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L16)*

___
<a id="registers.temp_xlsb"></a>

####  TEMP_XLSB

**● TEMP_XLSB**: *`number`* = 252

*Defined in [constants.ts:14](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L14)*

___

___
<a id="standby_time"></a>

### `<Const>` STANDBY_TIME

**STANDBY_TIME**: *`object`*

*Defined in [constants.ts:84](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L84)*

Values for T\_SB in the CONFIG register

<a id="standby_time.125ms"></a>

####  125ms

**● 125ms**: *`number`* = 2

*Defined in [constants.ts:87](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L87)*

___
<a id="standby_time.1s"></a>

####  1s

**● 1s**: *`number`* = 5

*Defined in [constants.ts:90](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L90)*

___
<a id="standby_time.250ms"></a>

####  250ms

**● 250ms**: *`number`* = 3

*Defined in [constants.ts:88](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L88)*

___
<a id="standby_time.2s"></a>

####  2s

**● 2s**: *`number`* = 6

*Defined in [constants.ts:91](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L91)*

___
<a id="standby_time.4s"></a>

####  4s

**● 4s**: *`number`* = 7

*Defined in [constants.ts:92](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L92)*

___
<a id="standby_time.500ms"></a>

####  500ms

**● 500ms**: *`number`* = 4

*Defined in [constants.ts:89](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L89)*

___
<a id="standby_time.500us"></a>

####  500us

**● 500us**: *`number`* = 0

*Defined in [constants.ts:85](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L85)*

___
<a id="standby_time.62ms"></a>

####  62ms

**● 62ms**: *`number`* = 1

*Defined in [constants.ts:86](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/constants.ts#L86)*

___

___

