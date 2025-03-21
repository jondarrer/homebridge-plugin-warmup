import { mock } from 'node:test';

export class PlatformAccessoryMock {
  context = {};
  getService = mock.fn((service) => service);

  constructor(name, uuid, category) {
    this.name = name;
    this.uuid = uuid;
    this.category = category;
  }
}
