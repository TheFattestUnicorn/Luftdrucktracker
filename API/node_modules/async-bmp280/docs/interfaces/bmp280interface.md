[async-bmp280](../README.md) > [BMP280Interface](../interfaces/bmp280interface.md)

# Interface: BMP280Interface

## Hierarchy

 `DeviceInterface`

**↳ BMP280Interface**

## Index

### Properties

* [address](bmp280interface.md#address)
* [bus](bmp280interface.md#bus)

### Methods

* [getId](bmp280interface.md#getid)
* [i2cRead](bmp280interface.md#i2cread)
* [i2cWrite](bmp280interface.md#i2cwrite)
* [init](bmp280interface.md#init)
* [readByte](bmp280interface.md#readbyte)
* [readConfig](bmp280interface.md#readconfig)
* [readControlMeasurement](bmp280interface.md#readcontrolmeasurement)
* [readI2cBlock](bmp280interface.md#readi2cblock)
* [readPressure](bmp280interface.md#readpressure)
* [readPressureCorrection](bmp280interface.md#readpressurecorrection)
* [readStatus](bmp280interface.md#readstatus)
* [readTemperature](bmp280interface.md#readtemperature)
* [readTemperatureCorrection](bmp280interface.md#readtemperaturecorrection)
* [readWord](bmp280interface.md#readword)
* [receiveByte](bmp280interface.md#receivebyte)
* [reset](bmp280interface.md#reset)
* [sendByte](bmp280interface.md#sendbyte)
* [writeByte](bmp280interface.md#writebyte)
* [writeConfig](bmp280interface.md#writeconfig)
* [writeControlMeasurement](bmp280interface.md#writecontrolmeasurement)
* [writeI2cBlock](bmp280interface.md#writei2cblock)
* [writeWord](bmp280interface.md#writeword)

---

## Properties

<a id="address"></a>

###  address

**● address**: *`number`*

*Inherited from DeviceInterface.address*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:4*

___
<a id="bus"></a>

###  bus

**● bus**: *`BusInterface`*

*Inherited from DeviceInterface.bus*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:5*

___

## Methods

<a id="getid"></a>

###  getId

▸ **getId**(): `Promise`<`number`>

*Defined in [BMP280Interface.ts:34](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L34)*

Reads device ID

**Returns:** `Promise`<`number`>

___
<a id="i2cread"></a>

###  i2cRead

▸ **i2cRead**(length: *`number`*, buffer: *`Buffer`*): `Promise`<`number`>

*Inherited from DeviceInterface.i2cRead*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:6*

**Parameters:**

| Name | Type |
| ------ | ------ |
| length | `number` |
| buffer | `Buffer` |

**Returns:** `Promise`<`number`>

___
<a id="i2cwrite"></a>

###  i2cWrite

▸ **i2cWrite**(length: *`number`*, buffer: *`Buffer`*): `Promise`<`number`>

*Inherited from DeviceInterface.i2cWrite*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:7*

**Parameters:**

| Name | Type |
| ------ | ------ |
| length | `number` |
| buffer | `Buffer` |

**Returns:** `Promise`<`number`>

___
<a id="init"></a>

###  init

▸ **init**(params?: *`Partial`<[BMP280ControlMeasurement](bmp280controlmeasurement.md) & [BMP280Config](bmp280config.md)>*): `Promise`<[BMP280Interface](bmp280interface.md)>

*Defined in [BMP280Interface.ts:29](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L29)*

Resets, reads temp/press correction and initializes the device with the params or default.
*__throws__*: DeviceError if device ID doesn't correspond with BMP280 id

**Parameters:**

| Name | Type |
| ------ | ------ |
| `Optional` params | `Partial`<[BMP280ControlMeasurement](bmp280controlmeasurement.md) & [BMP280Config](bmp280config.md)> |

**Returns:** `Promise`<[BMP280Interface](bmp280interface.md)>

___
<a id="readbyte"></a>

###  readByte

▸ **readByte**(command: *`number`*): `Promise`<`number`>

*Inherited from DeviceInterface.readByte*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:10*

**Parameters:**

| Name | Type |
| ------ | ------ |
| command | `number` |

**Returns:** `Promise`<`number`>

___
<a id="readconfig"></a>

###  readConfig

▸ **readConfig**(): `Promise`<[BMP280Config](bmp280config.md)>

*Defined in [BMP280Interface.ts:58](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L58)*

Reads and parses CONFIG register

**Returns:** `Promise`<[BMP280Config](bmp280config.md)>

___
<a id="readcontrolmeasurement"></a>

###  readControlMeasurement

▸ **readControlMeasurement**(): `Promise`<[BMP280ControlMeasurement](bmp280controlmeasurement.md)>

*Defined in [BMP280Interface.ts:49](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L49)*

Reads and parses CTRL\_MEAS register

**Returns:** `Promise`<[BMP280ControlMeasurement](bmp280controlmeasurement.md)>

___
<a id="readi2cblock"></a>

###  readI2cBlock

▸ **readI2cBlock**(command: *`number`*, length: *`number`*, buffer: *`Buffer`*): `Promise`<`number`>

*Inherited from DeviceInterface.readI2cBlock*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:11*

**Parameters:**

| Name | Type |
| ------ | ------ |
| command | `number` |
| length | `number` |
| buffer | `Buffer` |

**Returns:** `Promise`<`number`>

___
<a id="readpressure"></a>

###  readPressure

▸ **readPressure**(): `Promise`<`number`>

*Defined in [BMP280Interface.ts:83](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L83)*

Reads pressure in Pascals

**Returns:** `Promise`<`number`>

___
<a id="readpressurecorrection"></a>

###  readPressureCorrection

▸ **readPressureCorrection**(): `Promise`<[BMP280Interface](bmp280interface.md)>

*Defined in [BMP280Interface.ts:73](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L73)*

Reads and sets the pressure correction internally. This function is called from init, you should not need to call it directly.

**Returns:** `Promise`<[BMP280Interface](bmp280interface.md)>

___
<a id="readstatus"></a>

###  readStatus

▸ **readStatus**(): `Promise`<[BMP280Status](bmp280status.md)>

*Defined in [BMP280Interface.ts:44](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L44)*

Reads and parses STATUS register

**Returns:** `Promise`<[BMP280Status](bmp280status.md)>

___
<a id="readtemperature"></a>

###  readTemperature

▸ **readTemperature**(): `Promise`<`number`>

*Defined in [BMP280Interface.ts:78](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L78)*

Reads temperature in celsius degrees

**Returns:** `Promise`<`number`>

___
<a id="readtemperaturecorrection"></a>

###  readTemperatureCorrection

▸ **readTemperatureCorrection**(): `Promise`<[BMP280Interface](bmp280interface.md)>

*Defined in [BMP280Interface.ts:68](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L68)*

Reads and sets the temperature correction internally. This function is called from init, you should not need to call it directly.

**Returns:** `Promise`<[BMP280Interface](bmp280interface.md)>

___
<a id="readword"></a>

###  readWord

▸ **readWord**(command: *`number`*): `Promise`<`number`>

*Inherited from DeviceInterface.readWord*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:12*

**Parameters:**

| Name | Type |
| ------ | ------ |
| command | `number` |

**Returns:** `Promise`<`number`>

___
<a id="receivebyte"></a>

###  receiveByte

▸ **receiveByte**(): `Promise`<`number`>

*Inherited from DeviceInterface.receiveByte*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:8*

**Returns:** `Promise`<`number`>

___
<a id="reset"></a>

###  reset

▸ **reset**(): `Promise`<[BMP280Interface](bmp280interface.md)>

*Defined in [BMP280Interface.ts:39](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L39)*

Resets device

**Returns:** `Promise`<[BMP280Interface](bmp280interface.md)>

___
<a id="sendbyte"></a>

###  sendByte

▸ **sendByte**(byte: *`number`*): `Promise`<`void`>

*Inherited from DeviceInterface.sendByte*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:9*

**Parameters:**

| Name | Type |
| ------ | ------ |
| byte | `number` |

**Returns:** `Promise`<`void`>

___
<a id="writebyte"></a>

###  writeByte

▸ **writeByte**(command: *`number`*, byte: *`number`*): `Promise`<`void`>

*Inherited from DeviceInterface.writeByte*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:13*

**Parameters:**

| Name | Type |
| ------ | ------ |
| command | `number` |
| byte | `number` |

**Returns:** `Promise`<`void`>

___
<a id="writeconfig"></a>

###  writeConfig

▸ **writeConfig**(config: *`Partial`<[BMP280Config](bmp280config.md)>*): `Promise`<[BMP280Interface](bmp280interface.md)>

*Defined in [BMP280Interface.ts:62](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L62)*

Writes CONFIG register

**Parameters:**

| Name | Type |
| ------ | ------ |
| config | `Partial`<[BMP280Config](bmp280config.md)> |

**Returns:** `Promise`<[BMP280Interface](bmp280interface.md)>

___
<a id="writecontrolmeasurement"></a>

###  writeControlMeasurement

▸ **writeControlMeasurement**(controlMeasurement: *`Partial`<[BMP280ControlMeasurement](bmp280controlmeasurement.md)>*): `Promise`<[BMP280Interface](bmp280interface.md)>

*Defined in [BMP280Interface.ts:53](https://github.com/AlejandroHerr/async-bmp280/blob/d3b180f/src/lib/BMP280Interface.ts#L53)*

Writes CTRL\_MEAS register

**Parameters:**

| Name | Type |
| ------ | ------ |
| controlMeasurement | `Partial`<[BMP280ControlMeasurement](bmp280controlmeasurement.md)> |

**Returns:** `Promise`<[BMP280Interface](bmp280interface.md)>

___
<a id="writei2cblock"></a>

###  writeI2cBlock

▸ **writeI2cBlock**(command: *`number`*, length: *`number`*, buffer: *`Buffer`*): `Promise`<`number`>

*Inherited from DeviceInterface.writeI2cBlock*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:15*

**Parameters:**

| Name | Type |
| ------ | ------ |
| command | `number` |
| length | `number` |
| buffer | `Buffer` |

**Returns:** `Promise`<`number`>

___
<a id="writeword"></a>

###  writeWord

▸ **writeWord**(command: *`number`*, word: *`number`*): `Promise`<`void`>

*Inherited from DeviceInterface.writeWord*

*Defined in /Users/alejandro/projects/envirophat.js/async-bmp280/node_modules/async-i2c-bus/dist/main/lib/DeviceInterface.d.ts:14*

**Parameters:**

| Name | Type |
| ------ | ------ |
| command | `number` |
| word | `number` |

**Returns:** `Promise`<`void`>

___

