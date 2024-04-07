import { jest } from '@jest/globals';

export class ServiceMock {
  static AccessoryInformation = new ServiceMock('AccessoryInformation');
  static Thermostat = new ServiceMock('Thermostat');
  static TemperatureSensor = new ServiceMock('TemperatureSensor');

  constructor(name) {
    this.name = name;
  }

  getCharacteristic = jest.fn((characteristic) => characteristic);
  setCharacteristic = jest.fn(() => this);
}
