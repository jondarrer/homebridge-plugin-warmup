import { jest } from '@jest/globals';

import { CharacteristicMock } from './characteristic-mock.js';
import { ServiceMock } from './service-mock.js';

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

  platformAccessory = jest.fn((accessory = { context: {} }) => ({
    ...accessory,
    getService: jest.fn((service) => service),
  }));

  registerPlatformAccessories = jest.fn();

  unregisterPlatformAccessories = jest.fn();

  updatePlatformAccessories = jest.fn();

  hap = {
    Characteristic: CharacteristicMock,
    Service: ServiceMock,
    Categories: {
      THERMOSTAT: 9,
    },
    uuid: {
      generate: jest.fn().mockImplementation((uuid) => `UUID:${uuid}`),
    },
    HAPStatus: {
      READ_ONLY_CHARACTERISTIC: 'READ_ONLY_CHARACTERISTIC',
      NOT_ALLOWED_IN_CURRENT_STATE: 'NOT_ALLOWED_IN_CURRENT_STATE',
    },
    HapStatusError: Error,
  };
}
