export class CharacteristicMock {
  __handlers: Record<string, Function> = {};
  [x: string]: unknown;
  static Manufacturer = new CharacteristicMock('Manufacturer');
  static Model = new CharacteristicMock('Model');
  static SerialNumber = new CharacteristicMock('SerialNumber');
  static Name = new CharacteristicMock('Name');
  static CurrentHeatingCoolingState = new CharacteristicMock('CurrentHeatingCoolingState');
  static TargetHeatingCoolingState = new CharacteristicMock('TargetHeatingCoolingState');
  static CurrentTemperature = new CharacteristicMock('CurrentTemperature');
  static TargetTemperature = new CharacteristicMock('TargetTemperature');
  static TemperatureDisplayUnits = new CharacteristicMock('TemperatureDisplayUnits');

  value: unknown = null;
  set: Function = () => {};
  get: Function = () => {};

  onSet = (fn: Function) => {
    this.set = fn;
    this.on('set', fn);
    return this;
  };
  onGet = (fn: Function) => {
    this.get = fn;
    this.on('get', fn);
    return this;
  };

  on = (eventName: string, fn: Function) => (this.__handlers[eventName] = fn);
  emit = async (eventName: string, args?: unknown) => await this.__handlers[eventName](args);

  setProps: Function = () => this;
  updateValue = (value: unknown) => this.value = value;

  constructor(public name: string) {};
}

CharacteristicMock.CurrentHeatingCoolingState.OFF = 0;
CharacteristicMock.CurrentHeatingCoolingState.HEAT = 1;
CharacteristicMock.CurrentHeatingCoolingState.COOL = 2;

CharacteristicMock.TargetHeatingCoolingState.OFF = 0;
CharacteristicMock.TargetHeatingCoolingState.HEAT = 1;
CharacteristicMock.TargetHeatingCoolingState.COOL = 2;
CharacteristicMock.TargetHeatingCoolingState.AUTO = 3;

CharacteristicMock.TemperatureDisplayUnits.CELSIUS = 'celsius';
