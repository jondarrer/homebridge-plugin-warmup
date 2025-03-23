import { CharacteristicMock } from "./characteristic-mock.js";

export class ServiceMock {
  static AccessoryInformation = new ServiceMock('AccessoryInformation');
  static Thermostat = new ServiceMock('Thermostat');
  static TemperatureSensor = new ServiceMock('TemperatureSensor');

  constructor(public name: string) {}

  getCharacteristic: Function = (characteristic: CharacteristicMock) => characteristic;
  setCharacteristic: Function = (_characteristic: CharacteristicMock, _value: unknown) => this;
}
