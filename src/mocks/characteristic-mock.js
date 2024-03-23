import { jest } from '@jest/globals';

export class CharacteristicMock {
  static Manufacturer = new CharacteristicMock('Manufacturer');
  static Model = new CharacteristicMock('Model');
  static SerialNumber = new CharacteristicMock('SerialNumber');
  static Name = new CharacteristicMock('Name');
  static CurrentHeatingCoolingState = new CharacteristicMock('CurrentHeatingCoolingState');
  static TargetHeatingCoolingState = new CharacteristicMock('TargetHeatingCoolingState');
  static CurrentTemperature = new CharacteristicMock('CurrentTemperature');
  static TargetTemperature = new CharacteristicMock('TargetTemperature');
  static TemperatureDisplayUnits = new CharacteristicMock('TemperatureDisplayUnits');

  name;
  value;
  set;
  get;

  onSet = (fn) => {
    this.set = fn;
    return this;
  };
  onGet = (fn) => {
    this.get = fn;
    return this;
  };

  on = (eventName, fn) => (this[eventName] = fn);
  emit = (eventName, args) => this[eventName](args);

  setProps = jest.fn();

  constructor(name) {
    this.name = name;
    this.value = null;
  }
}

CharacteristicMock.CurrentHeatingCoolingState.OFF = 0;
CharacteristicMock.CurrentHeatingCoolingState.HEAT = 1;
CharacteristicMock.CurrentHeatingCoolingState.COOL = 2;

CharacteristicMock.TargetHeatingCoolingState.OFF = 0;
CharacteristicMock.TargetHeatingCoolingState.HEAT = 1;
CharacteristicMock.TargetHeatingCoolingState.COOL = 2;
CharacteristicMock.TargetHeatingCoolingState.AUTO = 3;

CharacteristicMock.TemperatureDisplayUnits.CELSIUS = 'celsius';
