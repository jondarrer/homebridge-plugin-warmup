import { Maybe } from 'warmup-api/dist/src/types';

import type { PlatformAccessory, Service } from "homebridge";

import type { WarmupHomebridgePlatform } from "./warmup-homebridge-platform.js";

/**
 * Represents the air temperature sensor on the thermostat
 */
export class WarmupTemperatureSensorAccessory {
  static buildSerialNumber(userId: Maybe<number> | undefined, locationId: Maybe<number> | undefined, deviceId: Maybe<number> | undefined): string {
    return `${userId}-${locationId}-${deviceId}-air`;
  }

  static TYPE = 'Air Sensor';

  service: Service;

  constructor(private platform: WarmupHomebridgePlatform, private accessory: PlatformAccessory) {

    const {
      context: { userId, locationId, device },
    } = this.accessory;

    const deviceSN = WarmupTemperatureSensorAccessory.buildSerialNumber(userId, locationId, device.id);

    const { Manufacturer, Model, SerialNumber, Name, CurrentTemperature } = this.platform.Characteristic;

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      ?.setCharacteristic(Manufacturer, 'Warmup')
      .setCharacteristic(Model, `${device.type} Smart WiFi Temperature Sensor`)
      .setCharacteristic(SerialNumber, deviceSN);

    // get the TemperatureSensor service if it exists, otherwise create a new TemperatureSensor service
    this.service =
      this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);

    // set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(Name, `${device.roomName} (Air)`);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/TemperatureSensor
    this.service
      .getCharacteristic(CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this))
      .setProps({
        minValue: -10,
        maxValue: 50,
      })
      .updateValue(device.secondaryTemp / 10);
  }

  /**
   *
   * @returns {Promise<import('homebridge').CharacteristicValue>}
   */
  async getCurrentTemperature() {
    this.platform.log.debug(`[${this.accessory.context.device.roomName}-Air] CurrentTemperature begin reading`);

    const context = (await this.refreshDevice());
    const secondaryTemp = context?.device?.secondaryTemp;
    const roomName = context?.device?.roomName;

    this.platform.log.debug(`[${roomName}-Air] CurrentTemperature read as`, secondaryTemp / 10);

    return secondaryTemp / 10;
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
    this.platform.log.debug(`[${roomName}-Air] Refreshing device ${id} with location ${locationId}.`);

    // Get the most up-to-date properties of the device
    const response = await this.platform.warmupService?.getDevice(locationId, id);
    const device = response?.data?.user?.owned?.[0]?.room ?? null;

    // Update the device with the latest values
    context.device = device;
    this.platform.log.debug(`[${device?.roomName}-Air] Device refreshed with response: ${JSON.stringify(response)}`);

    return context;
  }
}
