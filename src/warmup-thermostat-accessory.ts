import assert from 'node:assert';

import type { CharacteristicValue, PlatformAccessory, UnknownContext } from 'homebridge';
import { Maybe, Room } from 'warmup-api/dist/src/types';


import { RunMode } from './enums.js';
import { type WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class WarmupThermostatAccessory {
  static buildSerialNumber(userId: Maybe<number> | undefined, locationId: Maybe<number> | undefined, deviceId: Maybe<number> | undefined): string {
    return `${userId}-${locationId}-${deviceId}`;
  }

  static TYPE = 'Thermostat';

  /**
   * @type {import('homebridge').Service}
   */
  service;

  constructor(private platform: WarmupHomebridgePlatform, private accessory: PlatformAccessory) {
    const {
      context: { userId, locationId, device },
    } = accessory;

    const deviceSN = WarmupThermostatAccessory.buildSerialNumber(userId, locationId, device.id);

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
      ?.setCharacteristic(Manufacturer, 'Warmup')
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

  async getCurrentHeatingCoolingState(): Promise<CharacteristicValue> {
    this.platform.log.debug(`[${this.accessory.context.device.roomName}] CurrentHeatingCoolingState begin reading`);

    const context = (await this.refreshDevice());
    const roomName = context?.device?.roomName;
    const runModeInt = context?.device?.runModeInt;

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

  async getTargetHeatingCoolingState(): Promise<CharacteristicValue> {
    this.platform.log.debug(`[${this.accessory.context.device.roomName}] TargetHeatingCoolingState begin reading`);

    const context = (await this.refreshDevice());
    const roomName = context?.device?.roomName;
    const runModeInt = context?.device?.runModeInt;

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

  async setTargetHeatingCoolingState(value: CharacteristicValue) {
    assert.ok(this.platform.warmupService);
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

          const targetTemperature = this.service.getCharacteristic(TargetTemperature).value as number;

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

        const newTargetTemp = (await this.refreshDevice())?.device?.targetTemp as number;

        this.platform.log.debug(
          `[${roomName}] TargetHeatingCoolingState set to`,
          TargetHeatingCoolingState.AUTO,
          'and override cancelled'
        );

        this.service.getCharacteristic(TargetTemperature).updateValue(newTargetTemp / 10);

        this.platform.log.debug(
          `[${roomName}] TargetHeatingCoolingState setting TargetTemperature to`,
          newTargetTemp / 10
        );

        break;
    }
  }

  async getTemperatureDisplayUnits(): Promise<CharacteristicValue> {
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

  async setTemperatureDisplayUnits(value: CharacteristicValue) {
    const {
      context: {
        device: { roomName },
      },
    } = this.accessory;

    this.platform.log.warn(`[${roomName}] TemperatureDisplayUnits attempted to set to`, value);

    throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.READ_ONLY_CHARACTERISTIC);
  }

  async getTargetTemperature(): Promise<CharacteristicValue> {
    this.platform.log.debug(`[${this.accessory.context.device.roomName}] TargetTemperature begin reading`);

    const context = await this.refreshDevice();
    const overrideTemp = context?.device?.overrideTemp;
    const roomName = context?.device?.roomName;
    const runModeInt = context?.device?.runModeInt;
    const targetTemp = context?.device?.targetTemp;

    let result;

    switch (runModeInt) {
      case RunMode.OVERRIDE:
        result = (overrideTemp as number) / 10;
        break;
      // We'll get the target temperature for the device even though it's marked as off
      case RunMode.OFF:
      case RunMode.SCHEDULE:
      case RunMode.FIXED:
      default:
        result = (targetTemp as number) / 10;
        break;
    }

    this.platform.log.debug(`[${roomName}] TargetTemperature read as`, result);

    return result;
  }

  async setTargetTemperature(value: CharacteristicValue) {
    assert.ok(this.platform.warmupService);
    const {
      context: {
        locationId,
        device: { id, roomName, runModeInt, runMode },
      },
    } = this.accessory;

    this.platform.log.debug(`[${roomName}] TargetTemperature begin setting`, value);

    const { TargetHeatingCoolingState } = this.platform.Characteristic;

    switch (runModeInt) {
      case RunMode.SCHEDULE:
      case RunMode.OVERRIDE:
        await this.platform.warmupService.deviceOverride({
          locationId: locationId,
          roomId: id,
          temperature: (value as number) * 10,
          minutes: 60,
        });

        await this.refreshDevice();

        this.platform.log.debug(`[${roomName}] TargetTemperature set to`, value);

        this.service.getCharacteristic(TargetHeatingCoolingState).updateValue(TargetHeatingCoolingState.HEAT);

        this.platform.log.debug(
          `[${roomName}] TargetTemperature setting TargetHeatingCoolingState to`,
          TargetHeatingCoolingState.HEAT
        );

        break;
      case RunMode.OFF:
      case RunMode.FIXED:
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

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    this.platform.log.debug(`[${this.accessory.context.device.roomName}] CurrentTemperature begin reading`);

    const currentTemp = (await this.refreshDevice())?.device?.currentTemp || 0;
    const roomName = (await this.refreshDevice())?.device?.roomName;

    this.platform.log.debug(`[${roomName}] CurrentTemperature read as`, currentTemp / 10);

    return currentTemp / 10;
  }

  async refreshDevice(): Promise<UnknownContext & { device: Maybe<Room> | undefined }> {
    assert.ok(this.platform.warmupService);
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
    const device = response?.data?.user?.owned?.[0]?.room;

    // Update the device with the latest values
    context.device = device;
    this.platform.log.debug(`[${device?.roomName}] Device refreshed with response: ${JSON.stringify(response)}`);

    return context as UnknownContext & { device: Maybe<Room> | undefined };
  }
}
