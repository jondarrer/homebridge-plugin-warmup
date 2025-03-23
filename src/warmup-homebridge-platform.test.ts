import { describe, it, beforeEach, mock, afterEach } from 'node:test';
import assert from 'node:assert';

import type { API, Logger, PlatformAccessory, UnknownContext } from 'homebridge';

import { APIMock, createLoggingMock } from './mocks/index.js';
import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js';
import { WarmupService } from './services/index.js';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';
import { WarmupThermostatAccessory } from './warmup-thermostat-accessory.js';
import { WarmupTemperatureSensorAccessory } from './warmup-temperature-sensor-accessory.js';

let log: Logger;
let config: any;
let api: API & APIMock;

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

type MockFunction<T extends (...args: any[]) => any> = T & { mock: { calls: Array<{arguments: Parameters<T>}>, callCount: () => number, restore: Function } };

let mockRegisterPlatformAccessories: MockFunction<APIMock['registerPlatformAccessories']>;

beforeEach(() => {
  log = createLoggingMock();
  config = {
    name: PLUGIN_NAME,
    platform: PLATFORM_NAME,
    token: 'some-valid-token',
  };
  api = new APIMock() as unknown as (API & APIMock);
  mockRegisterPlatformAccessories = mock.method(api, 'registerPlatformAccessories') as unknown as MockFunction<APIMock['registerPlatformAccessories']>;
});

afterEach(() => {
  mockRegisterPlatformAccessories.mock.restore();
});

describe('WarmupHomebridgePlatform', () => {
  it('should initialise without throwing', () => {
    // Arrange, Act & Assert
    assert.doesNotThrow(() => new WarmupHomebridgePlatform(log, config, api));
  });

  it('should register new accessories', async () => {
    // Arrange
    new WarmupHomebridgePlatform(log, config, api);
    mock.method(WarmupService.prototype, 'getDevices', async () =>
      Promise.resolve({
        data: { user: { id: USER_ID, owned: [{ id: LOCATION_ID, rooms: [BATHROOM_DEVICE, KITCHEN_DEVICE] }] } },
      })
    );

    // Act
    await api.emit('didFinishLaunching');

    console.log('HERE');

    // Assert
    assert.equal(mockRegisterPlatformAccessories.mock.callCount(), 4);

    // We have to split up the arguments for each call, as partialDeepStrictEqual
    // will fail when comparing a PlatformAccessory type object and a plain object,
    // as per https://nodejs.org/api/assert.html#comparison-details
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[2][0], {
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        deviceType: WarmupThermostatAccessory.TYPE,
        device: {
          id: BATHROOM_DEVICE.id,
        },
      },
    });
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[1].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[1].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[1].arguments[2][0], {
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        deviceType: WarmupTemperatureSensorAccessory.TYPE,
        device: {
          id: BATHROOM_DEVICE.id,
        },
      },
    });
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[2].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[2].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[2].arguments[2][0], {
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        deviceType: WarmupThermostatAccessory.TYPE,
        device: {
          id: KITCHEN_DEVICE.id,
        },
      },
    });
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[3].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[3].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[3].arguments[2][0], {
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        deviceType: WarmupTemperatureSensorAccessory.TYPE,
        device: {
          id: KITCHEN_DEVICE.id,
        },
      },
    });
  });

  it('should restore existing accessories', async () => {
    // Arrange
    const plugin = new WarmupHomebridgePlatform(log, config, api);
    mock.method(WarmupService.prototype, 'getDevices', async () => ({
      data: { user: { id: USER_ID, owned: [{ id: LOCATION_ID, rooms: [BATHROOM_DEVICE, KITCHEN_DEVICE] }] } },
    }));
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: mock.fn((service) => service),
    }  as unknown as PlatformAccessory<UnknownContext>;
    accessory.context.userId = USER_ID;
    accessory.context.locationId = LOCATION_ID;
    plugin.configureAccessory(accessory);
    const accessoryAir = {
      ...BATHROOM_ACCESSORY_AIR,
      getService: mock.fn((service) => service),
    } as unknown as PlatformAccessory<UnknownContext>;
    accessoryAir.context.userId = USER_ID;
    accessoryAir.context.locationId = LOCATION_ID;
    plugin.configureAccessory(accessoryAir);

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    assert.equal(mockRegisterPlatformAccessories.mock.callCount(), 2);

    // We have to split up the arguments for each call, as partialDeepStrictEqual
    // will fail when comparing a PlatformAccessory type object and a plain object,
    // as per https://nodejs.org/api/assert.html#comparison-details
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[2][0], {
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        deviceType: WarmupThermostatAccessory.TYPE,
        device: {
          id: KITCHEN_DEVICE.id,
        },
      },
    });
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[1].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[1].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[1].arguments[2][0], {
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        deviceType: WarmupTemperatureSensorAccessory.TYPE,
        device: {
          id: KITCHEN_DEVICE.id,
        },
      },
    });
  });

  it('should unregister unused accessories', async () => {
    // Arrange
    const plugin = new WarmupHomebridgePlatform(log, config, api);
    mock.method(WarmupService.prototype, 'getDevices', async () => ({
      data: { user: { id: USER_ID, owned: [{ id: LOCATION_ID, rooms: [KITCHEN_DEVICE] }] } },
    }));
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: mock.fn((service) => service),
    } as unknown as PlatformAccessory<UnknownContext>;
    accessory.context.userId = USER_ID;
    accessory.context.locationId = LOCATION_ID;
    plugin.configureAccessory(accessory);
    const accessoryAir = {
      ...BATHROOM_ACCESSORY_AIR,
      getService: mock.fn((service) => service),
    } as unknown as PlatformAccessory<UnknownContext>;
    accessoryAir.context.userId = USER_ID;
    accessoryAir.context.locationId = LOCATION_ID;
    plugin.configureAccessory(accessoryAir);

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    assert.equal(mockRegisterPlatformAccessories.mock.callCount(), 2);

    // We have to split up the arguments for each call, as partialDeepStrictEqual
    // will fail when comparing a PlatformAccessory type object and a plain object,
    // as per https://nodejs.org/api/assert.html#comparison-details
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[2][0], {
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        deviceType: WarmupThermostatAccessory.TYPE,
        device: {
          id: KITCHEN_DEVICE.id,
        },
      },
    });
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[1].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[1].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[1].arguments[2][0], {
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        deviceType: WarmupTemperatureSensorAccessory.TYPE,
        device: {
          id: KITCHEN_DEVICE.id,
        },
      },
    });
  });
});
