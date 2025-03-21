import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import { HomebridgeMock, createLoggingMock } from './mocks/index.js';

import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js';
import { WarmupService } from './services/index.js';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';
import { WarmupTemperatureSensorAccessory } from './warmup-temperature-sensor-accessory.js';

let log;
let config;
let api;
let platform;

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
  };
  api = new HomebridgeMock();
  platform = new WarmupHomebridgePlatform(log, config, api);
  mock.reset();
});

it('should initialise without throwing', () => {
  // Arrange
  const accessory = {
    ...BATHROOM_ACCESSORY,
    getService: mock.fn((service) => service),
  };
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
    mock.method(CurrentTemperature, 'updateValue');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: mock.fn((service) => service),
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, secondaryTemp },
      },
    };

    // Act
    new WarmupTemperatureSensorAccessory(platform, accessory);

    // Assert
    assert.ok(CurrentTemperature.updateValue.mock.callCount() > 0);
    assert.deepEqual(CurrentTemperature.updateValue.mock.calls[0].arguments, [secondaryTemp / 10]);
  });

  it('should get the current temperature', async () => {
    // Arrange
    const { CurrentTemperature } = platform.Characteristic;
    mock.method(CurrentTemperature, 'onGet');
    const secondaryTemp = 215;
    mock.method(WarmupService.prototype, 'getDevice', async () =>
      Promise.resolve({
        data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, secondaryTemp } }] } },
      })
    );
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: mock.fn((service) => service),
    };
    const sensor = new WarmupTemperatureSensorAccessory(platform, accessory);

    // Act
    const result = await sensor.service.getCharacteristic(CurrentTemperature).emit('get');

    // Assert
    assert.equal(result, secondaryTemp / 10);
  });
});
