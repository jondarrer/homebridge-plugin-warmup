import { RunMode } from './enums.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class WarmupPlatformAccessory {
  /**
   *
   * @param {number} userId
   * @param {number} locationId
   * @param {number} deviceId
   * @returns {string}
   */
  static buildSerialNumber(userId, locationId, deviceId) {
    return `${userId}-${locationId}-${deviceId}`;
  }

  /**
   * @type {import('homebridge').Service}
   */
  service;

  /**
   *
   * @param {import('./warmup-homebridge-platform').WarmupHomebridgePlatform} platform
   * @param {import('homebridge').PlatformAccessory} accessory
   */
  constructor(platform, accessory) {
    this.platform = platform;
    this.accessory = accessory;

    const {
      context: { userId, locationId, device },
    } = accessory;

    const deviceSN = WarmupPlatformAccessory.buildSerialNumber(userId, locationId, device.id);

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Warmup')
      .setCharacteristic(this.platform.Characteristic.Model, `${device.type} Smart WiFi Thermostat`)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, deviceSN);

    // get the Thermostat service if it exists, otherwise create a new Thermostat service
    this.service =
      this.accessory.getService(this.platform.Service.Thermostat) ||
      this.accessory.addService(this.platform.Service.Thermostat);

    // set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, device.roomName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Thermostat
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .onGet(this.getCurrentHeatingCoolingState.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onGet(this.getTargetHeatingCoolingState.bind(this))
      .onSet(this.setTargetHeatingCoolingState.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onGet(this.getTargetTemperature.bind(this))
      .onSet(this.setTargetTemperature.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .onGet(this.getTemperatureDisplayUnits.bind(this))
      .onSet(this.setTemperatureDisplayUnits.bind(this));
  }

  /**
   *
   * @returns {Promise<import('homebridge').CharacteristicValue>}
   */
  async getCurrentHeatingCoolingState() {
    const device = await this.refreshDevice();

    const { CurrentHeatingCoolingState } = this.platform.Characteristic;

    switch (device.runModeInt) {
      case RunMode.OFF:
        return CurrentHeatingCoolingState.OFF;
      case RunMode.SCHEDULE:
      case RunMode.FIXED:
      case RunMode.OVERRIDE:
      default:
        return CurrentHeatingCoolingState.HEAT;
    }
  }

  /**
   *
   * @returns {Promise<Promise<import('homebridge').CharacteristicValue>}
   */
  async getTargetHeatingCoolingState() {
    await this.refreshDevice();
    const {
      context: { device },
    } = this.accessory;

    const { TargetHeatingCoolingState } = this.platform.Characteristic;

    switch (device.runModeInt) {
      case RunMode.OFF:
        return TargetHeatingCoolingState.OFF;
      case RunMode.SCHEDULE:
        return TargetHeatingCoolingState.AUTO;
      case RunMode.FIXED:
      case RunMode.OVERRIDE:
      default:
        return TargetHeatingCoolingState.HEAT;
    }
  }

  /**
   *
   * @param {Promise<import('homebridge').CharacteristicValue} value
   */
  async setTargetHeatingCoolingState(value) {
    const device = await this.refreshDevice();

    const { TargetHeatingCoolingState, TargetTemperature } = this.platform.Characteristic;

    switch (value) {
      case TargetHeatingCoolingState.OFF: // Off
        await this.platform.warmupService.deviceOff({ locationId: device.locationId, roomId: device.id });
        break;
      case TargetHeatingCoolingState.HEAT: // Heat
        if (device.runMode === 'fixed') {
          // Do nothing, as can't do anything with fixed
        } else {
          // device.runMode === 'override' || device.runMode === 'schedule' || device.runMode === 'off'

          const targetTemperature = this.service.getCharacteristic(TargetTemperature).value;
          await this.platform.warmupService.deviceOverride({
            locationId: device.locationId,
            roomId: device.id,
            temperature: targetTemperature * 10,
            minutes: 60,
          });

          await this.refreshDevice();
        }
        break;
      case TargetHeatingCoolingState.AUTO: // Auto
        await this.platform.warmupService.deviceOverrideCancel({ locationId: device.locationId, roomId: device.id });

        await this.refreshDevice();
        break;
    }

    this.platform.log.debug('Set Characteristic On ->', value);

    return true;
  }

  /**
   *
   * @returns {Promise<Promise<import('homebridge').CharacteristicValue>}
   */
  async getTemperatureDisplayUnits() {
    const { TemperatureDisplayUnits } = this.platform.Characteristic;

    this.platform.log.debug('Get Characteristic TemperatureDisplayUnits ->', TemperatureDisplayUnits.CELSIUS);

    return TemperatureDisplayUnits.CELSIUS;
  }

  /**
   *
   * @param {Promise<import('homebridge').CharacteristicValue} value
   */
  async setTemperatureDisplayUnits(value) {
    this.platform.log.warn(`Attempted change of temperature units to ${value}`);
    throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.READ_ONLY_CHARACTERISTIC);
  }

  /**
   *
   * @returns {Promise<Promise<import('homebridge').CharacteristicValue>}
   */
  async getTargetTemperature() {
    const device = await this.refreshDevice();

    switch (device.runModeInt) {
      case RunMode.OVERRIDE:
        return device.overrideTemp / 10;
      // We'll get the target temperature for the device even though it's marked as off
      case RunMode.OFF:
      case RunMode.SCHEDULE:
      case RunMode.FIXED:
      default:
        return device.targetTemp / 10;
    }
  }

  /**
   *
   * @param {Promise<import('homebridge').CharacteristicValue} value
   */
  async setTargetTemperature(value) {
    const device = await this.refreshDevice();

    switch (device.runMode) {
      case 'fixed':
      case 'schedule':
      case 'override':
        await this.platform.warmupService.deviceOverride({
          locationId: device.locationId,
          roomId: device.id,
          temperature: value * 10,
          minutes: 60,
        });

        await this.refreshDevice();
        break;
      case 'off':
      default:
        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE);
    }

    this.platform.log.debug('Set Characteristic On ->', value);

    return true;
  }

  /**
   *
   * @returns {Promise<Promise<import('homebridge').CharacteristicValue>}
   */
  async getCurrentTemperature() {
    const device = await this.refreshDevice();

    return device.currentTemp / 10;
  }

  /**
   *
   * @returns {Promise<any>}
   */
  async refreshDevice() {
    const { context } = this.accessory;

    // Get the most up-to-date properties of the device
    const {
      data: {
        user: {
          owned: [{ room: device }],
        },
      },
    } = await this.platform.warmupService.getDevice(context.locationId, context.device.id);

    // Update the device with the latest values
    context.device = device;

    return device;
  }
}
