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

    const {
      Manufacturer,
      Model,
      SerialNumber,
      Name,
      CurrentHeatingCoolingState,
      TargetHeatingCoolingState,
      CurrentTemperature,
      TargetTemperature,
      TemperatureDisplayUnits,
    } = this.platform.Characteristic;

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(Manufacturer, 'Warmup')
      .setCharacteristic(Model, `${device.type} Smart WiFi Thermostat`)
      .setCharacteristic(SerialNumber, deviceSN);

    // get the Thermostat service if it exists, otherwise create a new Thermostat service
    this.service =
      this.accessory.getService(this.platform.Service.Thermostat) ||
      this.accessory.addService(this.platform.Service.Thermostat);

    // set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(Name, device.roomName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Thermostat
    this.service.getCharacteristic(CurrentHeatingCoolingState).onGet(this.getCurrentHeatingCoolingState.bind(this));

    let targetHeatingCoolingState;

    switch (device.runModeInt) {
      case RunMode.OFF:
        targetHeatingCoolingState = TargetHeatingCoolingState.OFF;
        break;
      case RunMode.SCHEDULE:
        targetHeatingCoolingState = TargetHeatingCoolingState.AUTO;
        break;
      case RunMode.FIXED:
      case RunMode.OVERRIDE:
      default:
        targetHeatingCoolingState = TargetHeatingCoolingState.HEAT;
        break;
    }

    this.service
      .getCharacteristic(TargetHeatingCoolingState)
      .onGet(this.getTargetHeatingCoolingState.bind(this))
      .onSet(this.setTargetHeatingCoolingState.bind(this))
      .setProps({
        validValues: [TargetHeatingCoolingState.OFF, TargetHeatingCoolingState.HEAT, TargetHeatingCoolingState.AUTO],
      })
      .updateValue(targetHeatingCoolingState);

    this.service
      .getCharacteristic(CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this))
      .setProps({
        minValue: -10,
        maxValue: 50,
      })
      .updateValue(device.currentTemp / 10);

    this.service
      .getCharacteristic(TargetTemperature)
      .onGet(this.getTargetTemperature.bind(this))
      .onSet(this.setTargetTemperature.bind(this))
      .setProps({
        minValue: 5,
        maxValue: 30,
      })
      .updateValue(device.targetTemp / 10);

    this.service
      .getCharacteristic(TemperatureDisplayUnits)
      .onGet(this.getTemperatureDisplayUnits.bind(this))
      .onSet(this.setTemperatureDisplayUnits.bind(this))
      .setProps({
        validValues: [TemperatureDisplayUnits.CELSIUS],
      });
  }

  /**
   *
   * @returns {Promise<import('homebridge').CharacteristicValue>}
   */
  async getCurrentHeatingCoolingState() {
    this.platform.log.debug(`[${this.accessory.context.device.roomName}] CurrentHeatingCoolingState begin reading`);

    const {
      device: { roomName, runModeInt },
    } = await this.refreshDevice();

    const { CurrentHeatingCoolingState } = this.platform.Characteristic;
    let result;

    switch (runModeInt) {
      case RunMode.OFF:
        result = CurrentHeatingCoolingState.OFF;
        break;
      case RunMode.SCHEDULE:
      case RunMode.FIXED:
      case RunMode.OVERRIDE:
      default:
        result = CurrentHeatingCoolingState.HEAT;
        break;
    }

    this.platform.log.debug(`[${roomName}] CurrentHeatingCoolingState read as`, result);

    return result;
  }

  /**
   *
   * @returns {Promise<Promise<import('homebridge').CharacteristicValue>}
   */
  async getTargetHeatingCoolingState() {
    this.platform.log.debug(`[${this.accessory.context.device.roomName}] TargetHeatingCoolingState begin reading`);

    const {
      device: { roomName, runModeInt },
    } = await this.refreshDevice();

    const { TargetHeatingCoolingState } = this.platform.Characteristic;
    let result;

    switch (runModeInt) {
      case RunMode.OFF:
        result = TargetHeatingCoolingState.OFF;
        break;
      case RunMode.SCHEDULE:
        result = TargetHeatingCoolingState.AUTO;
        break;
      case RunMode.FIXED:
      case RunMode.OVERRIDE:
      default:
        result = TargetHeatingCoolingState.HEAT;
        break;
    }

    this.platform.log.debug(`[${roomName}] TargetHeatingCoolingState read as`, result);

    return result;
  }

  /**
   *
   * @param {Promise<import('homebridge').CharacteristicValue} value
   */
  async setTargetHeatingCoolingState(value) {
    const {
      context: {
        locationId,
        device: { id, roomName, runMode },
      },
    } = this.accessory;

    this.platform.log.debug(`[${roomName}] TargetHeatingCoolingState begin setting`, value);

    const { TargetHeatingCoolingState, TargetTemperature } = this.platform.Characteristic;

    switch (value) {
      case TargetHeatingCoolingState.OFF: // Off
        await this.platform.warmupService.deviceOff({ locationId, roomId: id });

        await this.refreshDevice();

        this.platform.log.debug(
          `[${roomName}] TargetHeatingCoolingState set to`,
          TargetHeatingCoolingState.OFF,
          'and device turned off'
        );

        break;
      case TargetHeatingCoolingState.HEAT: // Heat
        if (runMode === 'fixed') {
          // We can't do anything with fixed

          this.platform.log.warn(
            `[${roomName}] TargetHeatingCoolingState set to`,
            TargetHeatingCoolingState.HEAT,
            'but cannot as run mode is fixed'
          );

          throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE);
        } else {
          // runMode === 'override' || runMode === 'schedule' || runMode === 'off'

          const targetTemperature = this.service.getCharacteristic(TargetTemperature).value;

          await this.platform.warmupService.deviceOverride({
            locationId: locationId,
            roomId: id,
            temperature: targetTemperature * 10,
            minutes: 60,
          });

          await this.refreshDevice();

          this.platform.log.debug(
            `[${roomName}] TargetHeatingCoolingState set to`,
            TargetHeatingCoolingState.HEAT,
            `and an override has requested for the target of ${targetTemperature}`
          );
        }

        break;
      case TargetHeatingCoolingState.AUTO: // Auto
        await this.platform.warmupService.deviceOverrideCancel({ locationId, roomId: id });

        await this.refreshDevice();

        this.platform.log.debug(
          `[${roomName}] TargetHeatingCoolingState set to`,
          TargetHeatingCoolingState.AUTO,
          'and override cancelled'
        );

        break;
    }
  }

  /**
   *
   * @returns {Promise<Promise<import('homebridge').CharacteristicValue>}
   */
  async getTemperatureDisplayUnits() {
    const {
      context: {
        device: { roomName },
      },
    } = this.accessory;

    this.platform.log.debug(`[${roomName}] TemperatureDisplayUnits begin reading`);

    const { TemperatureDisplayUnits } = this.platform.Characteristic;

    this.platform.log.debug(`[${roomName}] TemperatureDisplayUnits read as`, TemperatureDisplayUnits.CELSIUS);

    return TemperatureDisplayUnits.CELSIUS;
  }

  /**
   *
   * @param {Promise<import('homebridge').CharacteristicValue} value
   */
  async setTemperatureDisplayUnits(value) {
    const {
      context: {
        device: { roomName },
      },
    } = this.accessory;

    this.platform.log.warn(`[${roomName}] TemperatureDisplayUnits attempted to set to`, value);

    throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.READ_ONLY_CHARACTERISTIC);
  }

  /**
   *
   * @returns {Promise<Promise<import('homebridge').CharacteristicValue>}
   */
  async getTargetTemperature() {
    this.platform.log.debug(`[${this.accessory.context.device.roomName}] TargetTemperature begin reading`);

    const {
      device: { overrideTemp, roomName, runModeInt, targetTemp },
    } = await this.refreshDevice();

    let result;

    switch (runModeInt) {
      case RunMode.OVERRIDE:
        result = overrideTemp / 10;
        break;
      // We'll get the target temperature for the device even though it's marked as off
      case RunMode.OFF:
      case RunMode.SCHEDULE:
      case RunMode.FIXED:
      default:
        result = targetTemp / 10;
        break;
    }

    this.platform.log.debug(`[${roomName}] TargetTemperature read as`, result);

    return result;
  }

  /**
   *
   * @param {Promise<import('homebridge').CharacteristicValue} value
   */
  async setTargetTemperature(value) {
    const {
      context: {
        locationId,
        device: { id, roomName, runMode },
      },
    } = this.accessory;

    this.platform.log.debug(`[${roomName}] TargetTemperature begin setting`, value);

    const { TargetHeatingCoolingState } = this.platform.Characteristic;

    switch (runMode) {
      case 'schedule':
      case 'override':
        await this.platform.warmupService.deviceOverride({
          locationId: locationId,
          roomId: id,
          temperature: value * 10,
          minutes: 60,
        });

        await this.refreshDevice();

        this.platform.log.debug(`[${roomName}] TargetTemperature set to`, value);

        if (this.service.getCharacteristic(TargetHeatingCoolingState).value !== TargetHeatingCoolingState.HEAT) {
          this.service.getCharacteristic(TargetHeatingCoolingState).updateValue(TargetHeatingCoolingState.HEAT);
        }

        break;
      case 'off':
      case 'fixed':
      default:
        // runMode === 'off' || runMode === 'fixed'

        this.platform.log.warn(
          `[${roomName}] TargetTemperature attempted to set to`,
          value,
          `but run mode is currently ${runMode}`
        );

        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE);
    }
  }

  /**
   *
   * @returns {Promise<Promise<import('homebridge').CharacteristicValue>}
   */
  async getCurrentTemperature() {
    this.platform.log.debug(`[${this.accessory.context.device.roomName}] CurrentTemperature begin reading`);

    const {
      device: { currentTemp, roomName },
    } = await this.refreshDevice();

    this.platform.log.debug(`[${roomName}] CurrentTemperature read as`, currentTemp / 10);

    return currentTemp / 10;
  }

  /**
   *
   * @returns {Promise<any>}
   */
  async refreshDevice() {
    const {
      context,
      context: {
        locationId,
        device: { roomName, id },
      },
    } = this.accessory;
    this.platform.log.debug(`[${roomName}] Refreshing device ${id} with location ${locationId}.`);

    // Get the most up-to-date properties of the device
    const response = await this.platform.warmupService.getDevice(locationId, id);
    const {
      data: {
        user: {
          owned: [{ room: device }],
        },
      },
    } = response;

    // Update the device with the latest values
    context.device = device;
    this.platform.log.debug(`[${device?.roomName}] Device refreshed with response: ${JSON.stringify(response)}`);

    return context;
  }
}
