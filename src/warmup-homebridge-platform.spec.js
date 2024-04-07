import { jest } from '@jest/globals';

import { HomebridgeMock, createLoggingMock } from './mocks/index.js';

import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js';
import { WarmupService } from './services/index.js';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';
import { WarmupThermostatAccessory } from './warmup-thermostat-accessory.js';
import { WarmupTemperatureSensorAccessory } from './warmup-temperature-sensor-accessory.js';

let log;
let config;
let api;

const USER_ID = 123;
const LOCATION_ID = 123123;

const BATHROOM_DEVICE = {
  id: 123456,
  type: '4ie',
  roomName: 'Bathroom',
  comfortTemp: 140,
  currentTemp: 255,
  mainTemp: 255,
  mainLabel: 'floor',
  secondaryTemp: 200,
  secondaryLabel: 'air',
  sleepTemp: 100,
  overrideDur: 60,
  overrideTemp: 100,
  fixedTemp: 160,
  awayTemp: 100,
  targetTemp: 100,
  runMode: 'override',
  runModeInt: 2,
  roomMode: 'program',
  roomModeInt: 1,
};

const BATHROOM_ACCESSORY = {
  UUID: `UUID:${USER_ID}-${LOCATION_ID}-${BATHROOM_DEVICE.id}`,
  displayName: 'BATHROOM_ACCESSORY',
  context: {
    userId: USER_ID,
    locationId: LOCATION_ID,
    deviceType: WarmupThermostatAccessory.TYPE,
    device: BATHROOM_DEVICE,
  },
};

const BATHROOM_ACCESSORY_AIR = {
  UUID: `UUID:${USER_ID}-${LOCATION_ID}-${BATHROOM_DEVICE.id}-air`,
  displayName: 'BATHROOM_ACCESSORY',
  context: {
    userId: USER_ID,
    locationId: LOCATION_ID,
    deviceType: WarmupTemperatureSensorAccessory.TYPE,
    device: BATHROOM_DEVICE,
  },
};

const KITCHEN_DEVICE = {
  id: 123457,
  type: '4ie',
  roomName: 'Kitchen',
  comfortTemp: 200,
  currentTemp: 210,
  mainTemp: 210,
  mainLabel: 'floor',
  secondaryTemp: 175,
  secondaryLabel: 'air',
  sleepTemp: 120,
  overrideDur: 0,
  overrideTemp: 200,
  fixedTemp: 0,
  awayTemp: 120,
  targetTemp: 200,
  runMode: 'schedule',
  runModeInt: 1,
  roomMode: 'program',
  roomModeInt: 1,
};

const KITCHEN_ACCESSORY = {
  UUID: `UUID:${USER_ID}-${LOCATION_ID}-${KITCHEN_DEVICE.id}`,
  displayName: 'KITCHEN_ACCESSORY',
  context: {
    userId: USER_ID,
    locationId: LOCATION_ID,
    deviceType: WarmupThermostatAccessory.TYPE,
    device: KITCHEN_DEVICE,
  },
};

const KITCHEN_ACCESSORY_AIR = {
  UUID: `UUID:${USER_ID}-${LOCATION_ID}-${KITCHEN_DEVICE.id}-air`,
  displayName: 'KITCHEN_ACCESSORY',
  context: {
    userId: USER_ID,
    locationId: LOCATION_ID,
    deviceType: WarmupTemperatureSensorAccessory.TYPE,
    device: KITCHEN_DEVICE,
  },
};

beforeEach(() => {
  log = createLoggingMock();
  config = {
    name: PLUGIN_NAME,
    platform: PLATFORM_NAME,
    token: 'some-valid-token',
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
    jest.spyOn(WarmupService.prototype, 'getDevices').mockResolvedValue({
      data: { user: { id: USER_ID, owned: [{ id: LOCATION_ID, rooms: [BATHROOM_DEVICE, KITCHEN_DEVICE] }] } },
    });

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    expect(api.registerPlatformAccessories).toHaveBeenCalledTimes(4);
    expect(api.registerPlatformAccessories).toHaveBeenCalledWith(
      PLUGIN_NAME,
      PLATFORM_NAME,
      expect.arrayContaining([
        expect.objectContaining({
          context: expect.objectContaining({
            userId: USER_ID,
            locationId: LOCATION_ID,
            deviceType: WarmupThermostatAccessory.TYPE,
            device: expect.objectContaining({
              id: BATHROOM_DEVICE.id,
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
            userId: USER_ID,
            locationId: LOCATION_ID,
            deviceType: WarmupThermostatAccessory.TYPE,
            device: expect.objectContaining({
              id: KITCHEN_DEVICE.id,
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
            userId: USER_ID,
            locationId: LOCATION_ID,
            deviceType: WarmupTemperatureSensorAccessory.TYPE,
            device: expect.objectContaining({
              id: BATHROOM_DEVICE.id,
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
            userId: USER_ID,
            locationId: LOCATION_ID,
            deviceType: WarmupTemperatureSensorAccessory.TYPE,
            device: expect.objectContaining({
              id: KITCHEN_DEVICE.id,
            }),
          }),
        }),
      ])
    );
  });

  it('should restore existing accessories', async () => {
    // Arrange
    const plugin = new WarmupHomebridgePlatform(log, config, api);
    jest.spyOn(WarmupService.prototype, 'getDevices').mockResolvedValue({
      data: { user: { id: USER_ID, owned: [{ id: LOCATION_ID, rooms: [BATHROOM_DEVICE, KITCHEN_DEVICE] }] } },
    });
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    accessory.context.userId = USER_ID;
    accessory.context.locationId = LOCATION_ID;
    plugin.configureAccessory(accessory);
    const accessoryAir = api.platformAccessory(BATHROOM_ACCESSORY_AIR);
    accessoryAir.context.userId = USER_ID;
    accessoryAir.context.locationId = LOCATION_ID;
    plugin.configureAccessory(accessoryAir);

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
            userId: USER_ID,
            locationId: LOCATION_ID,
            deviceType: WarmupThermostatAccessory.TYPE,
            device: expect.objectContaining({
              id: KITCHEN_DEVICE.id,
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
            userId: USER_ID,
            locationId: LOCATION_ID,
            deviceType: WarmupTemperatureSensorAccessory.TYPE,
            device: expect.objectContaining({
              id: KITCHEN_DEVICE.id,
            }),
          }),
        }),
      ])
    );
  });

  it('should unregister unused accessories', async () => {
    // Arrange
    const plugin = new WarmupHomebridgePlatform(log, config, api);
    jest.spyOn(WarmupService.prototype, 'getDevices').mockResolvedValue({
      data: { user: { id: USER_ID, owned: [{ id: LOCATION_ID, rooms: [KITCHEN_DEVICE] }] } },
    });
    plugin.configureAccessory(api.platformAccessory(BATHROOM_ACCESSORY));
    plugin.configureAccessory(api.platformAccessory(BATHROOM_ACCESSORY_AIR));

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    expect(api.unregisterPlatformAccessories).toHaveBeenCalledTimes(2);
    expect(api.unregisterPlatformAccessories).toHaveBeenCalledWith(
      PLUGIN_NAME,
      PLATFORM_NAME,
      expect.arrayContaining([
        expect.objectContaining({
          context: expect.objectContaining({
            userId: USER_ID,
            locationId: LOCATION_ID,
            deviceType: WarmupThermostatAccessory.TYPE,
            device: expect.objectContaining({
              id: BATHROOM_DEVICE.id,
            }),
          }),
        }),
      ])
    );
    expect(api.unregisterPlatformAccessories).toHaveBeenCalledWith(
      PLUGIN_NAME,
      PLATFORM_NAME,
      expect.arrayContaining([
        expect.objectContaining({
          context: expect.objectContaining({
            userId: USER_ID,
            locationId: LOCATION_ID,
            deviceType: WarmupTemperatureSensorAccessory.TYPE,
            device: expect.objectContaining({
              id: BATHROOM_DEVICE.id,
            }),
          }),
        }),
      ])
    );
  });
});
