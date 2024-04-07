import { jest } from '@jest/globals';

import { HomebridgeMock, createLoggingMock } from './mocks';

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
  platform = new WarmupHomebridgePlatform(log, config, api);
  jest.restoreAllMocks();
});

it('should initialise without throwing', () => {
  // Arrange
  const accessory = api.platformAccessory(BATHROOM_ACCESSORY);

  // Act & Assert
  expect(() => new WarmupTemperatureSensorAccessory(platform, accessory)).not.toThrow();
});

describe('CurrentTemperature', () => {
  it('should set the initial current temperature', async () => {
    // Arrange
    const secondaryTemp = 100;
    const { CurrentTemperature } = platform.Characteristic;
    const accessory = api.platformAccessory({
      ...BATHROOM_ACCESSORY,
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, secondaryTemp },
      },
    });

    // Act
    new WarmupTemperatureSensorAccessory(platform, accessory);

    // Assert
    expect(CurrentTemperature.updateValue).toHaveBeenCalledWith(secondaryTemp / 10);
  });
  it('should get the current temperature', async () => {
    // Arrange
    const { CurrentTemperature } = platform.Characteristic;
    const secondaryTemp = 215;
    jest.spyOn(WarmupService.prototype, 'getDevice').mockResolvedValue({
      data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, secondaryTemp } }] } },
    });
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const sensor = new WarmupTemperatureSensorAccessory(platform, accessory);

    // Act
    const result = await sensor.service.getCharacteristic(CurrentTemperature).emit('get');

    // Assert
    expect(result).toBe(secondaryTemp / 10);
  });
});
