/**
 * Represents the air temperature sensor on the thermostat
 */
export class WarmupTemperatureSensorAccessory {
  /**
   *
   * @param {number} userId
   * @param {number} locationId
   * @param {number} deviceId
   * @returns {string}
   */
  static buildSerialNumber(userId, locationId, deviceId) {
    return `${userId}-${locationId}-${deviceId}-air`;
  }

  static TYPE = 'Air Sensor';

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

    const deviceSN = WarmupTemperatureSensorAccessory.buildSerialNumber(userId, locationId, device.id);

    const { Manufacturer, Model, SerialNumber, Name, CurrentTemperature } = this.platform.Characteristic;

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(Manufacturer, 'Warmup')
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

    const {
      device: { secondaryTemp, roomName },
    } = await this.refreshDevice();

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
    this.platform.log.debug(`[${device?.roomName}-Air] Device refreshed with response: ${JSON.stringify(response)}`);

    return context;
  }
}
