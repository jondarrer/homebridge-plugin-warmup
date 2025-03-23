import { HAPMock } from "./hap-mock.js";
import { PlatformAccessoryMock } from "./platform-accessory-mock.js";

export interface IPlatformAccessoryConstructor {
  new (displayName: string, uuid: string, category: number): typeof PlatformAccessoryMock;
  prototype: PlatformAccessoryMock;
}

export class APIMock {
  __handlers: Record<string, Function> = {};

  set: Function = () => {};
  get: Function = () => {};

  onSet = (fn: Function) => {
    this.set = fn;
    return this;
  };
  onGet = (fn: Function) => {
    this.get = fn;
    return this;
  };

  hap = new HAPMock();

  on = (event: string, callback: Function) => {
    this.__handlers[event] = callback;
  };
  emit = async (event: string, args?: unknown) => {
    await this.__handlers[event](args);
  };

  registerPlatformAccessories = (pluginName: string, platformName: string, accessories: any[]) => {};
  unregisterPlatformAccessories = (pluginName: string, platformName: string, accessories: any[]) => {};
  updatePlatformAccessories = (pluginName: string, platformName: string, accessories: any[]) => {};

  platformAccessory: IPlatformAccessoryConstructor = PlatformAccessoryMock as unknown as IPlatformAccessoryConstructor;

  log = console.log;
}