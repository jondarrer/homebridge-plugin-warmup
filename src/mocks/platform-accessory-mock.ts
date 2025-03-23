import { ServiceMock } from './service-mock.js';

export class PlatformAccessoryMock {
  uuidts: string = '';
  context: object = {};
  
  getService = (service: ServiceMock) => service;
  addService = (service: ServiceMock) => service;

  constructor(public name: string, public uuid: string, public category: unknown) {}
}
