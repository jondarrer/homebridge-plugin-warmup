import { jest } from '@jest/globals';
import { WarmupService } from './services';

import { HomebridgeMock, createLoggingMock } from './mocks';

import { WarmupHomebridgePlatform } from './warmup-homebridge-platform';
import { PLUGIN_NAME, PLATFORM_NAME } from './settings';

let log;
let config;
let api;

const LOCATION_ID = 123;

const BATHROOM_DEVICE = {
  id: 123456,
  locationId: LOCATION_ID,
  deviceSN: 'D5CF07A1B0C2',
  isActive: true,
  runMode: 'override',
  roomSettings: {
    mode: 'program',
    name: 'Bathroom',
    preset: 'bathroom',
    overrideDur: 60,
    overrideTemp: 100,
    fixedTemp: 160,
    awayTemp: 100,
    targetTemp: 100,
  },
  airTemp: 200,
  floor1Temp: 255,
  floor2Temp: 0,
  comfortTemp: 140,
  type: '4ie',
  heatingTarget: 'floor',
  isFaultAir: false,
  isFaultFloor1: false,
  isFaultFloor2: true,
  minTemp: 50,
  maxTemp: 300,
  currentTemp: 140,
};

const BATHROOM_ACCESSORY = {
  UUID: 'UUID:D5CF07A1B0C2',
  displayName: 'BATHROOM_ACCESSORY',
  context: {
    device: BATHROOM_DEVICE,
  },
};

const KITCHEN_DEVICE = {
  id: 123457,
  locationId: LOCATION_ID,
  deviceSN: 'D5CF07A1B0C3',
  isActive: true,
  runMode: 'schedule',
  roomSettings: {
    mode: 'program',
    name: 'Kitchen',
    preset: 'kitchen',
    overrideDur: 0,
    overrideTemp: 200,
    fixedTemp: 0,
    awayTemp: 120,
    targetTemp: 120,
  },
  airTemp: 195,
  floor1Temp: 190,
  floor2Temp: 0,
  comfortTemp: 120,
  type: '4ie',
  heatingTarget: 'floor',
  isFaultAir: false,
  isFaultFloor1: false,
  isFaultFloor2: true,
  minTemp: 50,
  maxTemp: 300,
  currentTemp: 190,
};

const KITCHEN_ACCESSORY = {
  UUID: 'UUID:D5CF07A1B0C3',
  displayName: 'KITCHEN_ACCESSORY',
  context: {
    device: KITCHEN_DEVICE,
  },
};

beforeEach(() => {
  log = createLoggingMock();
  config = {
    name: PLUGIN_NAME,
    platform: PLATFORM_NAME,
  };
  api = new HomebridgeMock();
  jest.restoreAllMocks();
});

describe('WarmupHomebridgePlatform', () => {
  it('should initialise without throwing', () => {
    // Arrange, Act & Assert
    expect(() => new WarmupHomebridgePlatform(log, config, api)).not.toThrow();
  });

  it('should register new accessories', async () => {
    // Arrange
    new WarmupHomebridgePlatform(log, config, api);
    jest
      .spyOn(WarmupService.prototype, 'getDevices')
      .mockResolvedValue({ user: { owned: [{ id: LOCATION_ID, rooms: [BATHROOM_DEVICE, KITCHEN_DEVICE] }] } });

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    expect(api.registerPlatformAccessories).toHaveBeenCalledTimes(2);
    expect(api.registerPlatformAccessories).toHaveBeenCalledWith(
      PLUGIN_NAME,
      PLATFORM_NAME,
      expect.arrayContaining([
        expect.objectContaining({
          context: expect.objectContaining({
            device: expect.objectContaining({
              deviceSN: BATHROOM_DEVICE.deviceSN,
            }),
          }),
        }),
      ])
    );
    expect(api.registerPlatformAccessories).toHaveBeenCalledWith(
      PLUGIN_NAME,
      PLATFORM_NAME,
      expect.arrayContaining([
        expect.objectContaining({
          context: expect.objectContaining({
            device: expect.objectContaining({
              deviceSN: KITCHEN_DEVICE.deviceSN,
            }),
          }),
        }),
      ])
    );
  });

  it('should restore existing accessories', async () => {
    // Arrange
    const plugin = new WarmupHomebridgePlatform(log, config, api);
    jest
      .spyOn(WarmupService.prototype, 'getDevices')
      .mockResolvedValue({ user: { owned: [{ id: LOCATION_ID, rooms: [BATHROOM_DEVICE, KITCHEN_DEVICE] }] } });
    plugin.configureAccessory(api.platformAccessory(BATHROOM_ACCESSORY));

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    expect(api.registerPlatformAccessories).toHaveBeenCalledTimes(1);
    expect(api.registerPlatformAccessories).toHaveBeenCalledWith(
      PLUGIN_NAME,
      PLATFORM_NAME,
      expect.arrayContaining([
        expect.objectContaining({
          context: expect.objectContaining({
            device: expect.objectContaining({
              deviceSN: KITCHEN_DEVICE.deviceSN,
            }),
          }),
        }),
      ])
    );
  });

  it('should unregister unused accessories', async () => {
    // Arrange
    const plugin = new WarmupHomebridgePlatform(log, config, api);
    jest
      .spyOn(WarmupService.prototype, 'getDevices')
      .mockResolvedValue({ user: { owned: [{ id: LOCATION_ID, rooms: [KITCHEN_DEVICE] }] } });
    plugin.configureAccessory(api.platformAccessory(BATHROOM_ACCESSORY));

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    expect(api.unregisterPlatformAccessories).toHaveBeenCalledTimes(1);
    expect(api.unregisterPlatformAccessories).toHaveBeenCalledWith(
      PLUGIN_NAME,
      PLATFORM_NAME,
      expect.arrayContaining([
        expect.objectContaining({
          context: expect.objectContaining({
            device: expect.objectContaining({
              deviceSN: BATHROOM_DEVICE.deviceSN,
            }),
          }),
        }),
      ])
    );
  });
});
