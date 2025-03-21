import { mock } from 'node:test';

export class ServiceMock {
  static AccessoryInformation = new ServiceMock('AccessoryInformation');
  static Thermostat = new ServiceMock('Thermostat');
  static TemperatureSensor = new ServiceMock('TemperatureSensor');

  constructor(name) {
    this.name = name;
  }

  getCharacteristic = mock.fn((characteristic) => characteristic);
  setCharacteristic = mock.fn(() => this);
}
