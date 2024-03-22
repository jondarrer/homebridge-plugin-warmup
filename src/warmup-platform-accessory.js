import { RunMode } from './enums.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class WarmupPlatformAccessory {
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

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Warmup')
      .setCharacteristic(this.platform.Characteristic.Model, '44iE Smart WiFi Thermostat')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.deviceSN);

    // get the Thermostat service if it exists, otherwise create a new LightBulb service
    this.service =
      this.accessory.getService(this.platform.Service.Thermostat) ||
      this.accessory.addService(this.platform.Service.Thermostat);

    // set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.roomName);

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
    const { context } = this.accessory;
    const device = await this.platform.warmupService.getDevice(context.roomId);

    // Update the device with the latest values
    context.device = device;
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
    const { context } = this.accessory;
    const device = await this.platform.warmupService.getDevice(context.roomId);

    // Update the device with the latest values
    context.device = device;
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
    const { device } = this.accessory.context;
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
            temperature: targetTemperature,
            minutes: 60,
          });
        }
        break;
      case TargetHeatingCoolingState.AUTO: // Auto
        await this.platform.warmupService.deviceOverrideCancel({ locationId: device.locationId, roomId: device.id });
        break;
    }
    // this.accessory.context.device = value;

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

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

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
    const { context } = this.accessory;
    const device = await this.platform.warmupService.getDevice(context.roomId);

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
    const { context } = this.accessory;
    const device = await this.platform.warmupService.getDevice(context.roomId);

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
    const { context } = this.accessory;
    const device = await this.platform.warmupService.getDevice(context.roomId);

    return device.currentTemp / 10;
  }
}
