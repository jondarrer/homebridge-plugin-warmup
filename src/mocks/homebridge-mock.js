import { mock } from 'node:test';

import { CharacteristicMock } from './characteristic-mock.js';
import { ServiceMock } from './service-mock.js';
import { PlatformAccessoryMock } from './platform-accessory-mock.js';

export class HomebridgeMock {
  set;
  get;
  didFinishLaunching;

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

  platformAccessory = PlatformAccessoryMock;

  registerPlatformAccessories = mock.fn();

  unregisterPlatformAccessories = mock.fn();

  updatePlatformAccessories = mock.fn();

  hap = {
    Characteristic: CharacteristicMock,
    Service: ServiceMock,
    Categories: {
      THERMOSTAT: 9,
    },
    uuid: {
      generate: mock.fn((uuid) => `UUID:${uuid}`),
    },
    HAPStatus: {
      READ_ONLY_CHARACTERISTIC: 'READ_ONLY_CHARACTERISTIC',
      NOT_ALLOWED_IN_CURRENT_STATE: 'NOT_ALLOWED_IN_CURRENT_STATE',
    },
    HapStatusError: Error,
  };
}
