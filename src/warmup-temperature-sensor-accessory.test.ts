import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import { API, Characteristic, Logger, PlatformAccessory } from 'homebridge';

import { APIMock, CharacteristicMock, createLoggingMock } from './mocks/index.js';
import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js';
import { WarmupService } from './services/index.js';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';
import { WarmupTemperatureSensorAccessory } from './warmup-temperature-sensor-accessory.js';

let log: Logger;
let config;
let api: API & APIMock;
let platform: WarmupHomebridgePlatform;

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
    device: BATHROOM_DEVICE,
  },
};

beforeEach(() => {
  log = createLoggingMock();
  config = {
    name: PLUGIN_NAME,
    platform: PLATFORM_NAME,
    token: 'valid-token',
  };
  api = new APIMock() as unknown as (API & APIMock);
  platform = new WarmupHomebridgePlatform(log, config, api);

  // Simulate the platform having been launched
  platform.warmupService = new WarmupService(log, config.token);
  mock.reset();
});

it('should initialise without throwing', () => {
  // Arrange
  const accessory = {
    ...BATHROOM_ACCESSORY,
    getService: mock.fn((service) => service),
  } as unknown as PlatformAccessory;
  accessory.context.userId = USER_ID;
  accessory.context.locationId = LOCATION_ID;

  // Act & Assert
  assert.doesNotThrow(() => new WarmupTemperatureSensorAccessory(platform, accessory));
});

describe('CurrentTemperature', () => {
  it('should set the initial current temperature', async () => {
    // Arrange
    const secondaryTemp = 100;
    const { CurrentTemperature } = platform.Characteristic;
    const mockUpdateValue = mock.method(CurrentTemperature as unknown as Characteristic, 'updateValue');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: mock.fn((service) => service),
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, secondaryTemp },
      },
    } as unknown as PlatformAccessory;

    // Act
    new WarmupTemperatureSensorAccessory(platform, accessory);

    // Assert
    assert.ok(mockUpdateValue.mock.callCount() > 0);
    assert.deepEqual(mockUpdateValue.mock.calls[0].arguments, [secondaryTemp / 10]);
  });

  it('should get the current temperature', async () => {
    // Arrange
    const { CurrentTemperature } = platform.Characteristic;
    mock.method(CurrentTemperature as unknown as Characteristic, 'onGet');
    const secondaryTemp = 215;
    mock.method(WarmupService.prototype, 'getDevice', async () =>
      Promise.resolve({
        data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, secondaryTemp } }] } },
      })
    );
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: mock.fn((service) => service),
    } as unknown as PlatformAccessory;
    const sensor = new WarmupTemperatureSensorAccessory(platform, accessory);

    // Act
    const result = await (sensor.service.getCharacteristic(CurrentTemperature) as unknown as CharacteristicMock).emit('get');

    // Assert
    assert.equal(result, secondaryTemp / 10);
  });
});
