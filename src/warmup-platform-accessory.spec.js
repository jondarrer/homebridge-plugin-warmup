import { jest } from '@jest/globals';

import { HomebridgeMock, CharacteristicMock, createLoggingMock } from './mocks';

import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js';
import { RunMode } from './enums.js';
import { WarmupService } from './services/index.js';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';
import { WarmupPlatformAccessory } from './warmup-platform-accessory.js';

let log;
let config;
let api;
let platform;

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
  deviceSN: 'D5CF07A1B0C2',
  locationId: 123123,
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
  deviceSN: 'D5CF07A1B0C3',
  locationId: 123123,
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
  platform = new WarmupHomebridgePlatform(log, config, api);
  jest.restoreAllMocks();
});

it('should initialise without throwing', () => {
  // Arrange
  const accessory = api.platformAccessory(BATHROOM_ACCESSORY);

  // Act & Assert
  expect(() => new WarmupPlatformAccessory(platform, accessory)).not.toThrow();
});

describe('CurrentHeatingCoolingState', () => {
  it.each([
    {
      runModeInt: RunMode.OFF,
      runMode: 'off',
      expected: CharacteristicMock.CurrentHeatingCoolingState.OFF,
      expectedText: 'OFF',
    },
    {
      runModeInt: RunMode.SCHEDULE,
      runMode: 'schedule',
      expected: CharacteristicMock.CurrentHeatingCoolingState.HEAT,
      expectedText: 'HEAT',
    },
    {
      runModeInt: RunMode.FIXED,
      runMode: 'fixed',
      expected: CharacteristicMock.CurrentHeatingCoolingState.HEAT,
      expectedText: 'HEAT',
    },
    {
      runModeInt: RunMode.OVERRIDE,
      runMode: 'override',
      expected: CharacteristicMock.CurrentHeatingCoolingState.HEAT,
      expectedText: 'HEAT',
    },
    {
      runModeInt: undefined,
      runMode: undefined,
      expected: CharacteristicMock.CurrentHeatingCoolingState.HEAT,
      expectedText: 'HEAT',
    },
  ])('should get state of $expectedText when run mode is $runMode', async ({ runModeInt, runMode, expected }) => {
    // Arrange
    const { CurrentHeatingCoolingState } = platform.Characteristic;
    jest.spyOn(WarmupService.prototype, 'getDevice').mockResolvedValue({ ...BATHROOM_DEVICE, runModeInt, runMode });
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const thermostat = new WarmupPlatformAccessory(platform, accessory);

    // Act
    const result = await thermostat.service.getCharacteristic(CurrentHeatingCoolingState).emit('get');

    // Assert
    expect(result).toBe(expected);
  });
});

describe('TargetHeatingCoolingState', () => {
  it.each([
    {
      runModeInt: RunMode.OFF,
      runMode: 'off',
      expected: CharacteristicMock.TargetHeatingCoolingState.OFF,
      expectedText: 'OFF',
    },
    {
      runModeInt: RunMode.SCHEDULE,
      runMode: 'schedule',
      expected: CharacteristicMock.TargetHeatingCoolingState.AUTO,
      expectedText: 'AUTO',
    },
    {
      runModeInt: RunMode.FIXED,
      runMode: 'fixed',
      expected: CharacteristicMock.TargetHeatingCoolingState.HEAT,
      expectedText: 'HEAT',
    },
    {
      runModeInt: RunMode.OVERRIDE,
      runMode: 'override',
      expected: CharacteristicMock.TargetHeatingCoolingState.HEAT,
      expectedText: 'HEAT',
    },
    {
      runModeInt: undefined,
      runMode: undefined,
      expected: CharacteristicMock.TargetHeatingCoolingState.HEAT,
      expectedText: 'HEAT',
    },
  ])('should get state as $expectedText when run mode is $runMode', async ({ runModeInt, runMode, expected }) => {
    // Arrange
    const { TargetHeatingCoolingState } = platform.Characteristic;
    jest.spyOn(WarmupService.prototype, 'getDevice').mockResolvedValue({ ...BATHROOM_DEVICE, runModeInt, runMode });
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const thermostat = new WarmupPlatformAccessory(platform, accessory);

    // Act
    const result = await thermostat.service.getCharacteristic(TargetHeatingCoolingState).emit('get');

    // Assert
    expect(result).toBe(expected);
  });

  it.each([
    {
      state: CharacteristicMock.TargetHeatingCoolingState.OFF,
      stateText: 'OFF',
      runModeInt: RunMode.OFF,
      runMode: 'off',
      method: 'deviceOff',
      args: { locationId: BATHROOM_DEVICE.locationId, roomId: BATHROOM_DEVICE.id },
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.AUTO,
      stateText: 'AUTO',
      runModeInt: RunMode.SCHEDULE,
      runMode: 'schedule',
      method: 'deviceOverrideCancel',
      args: { locationId: BATHROOM_DEVICE.locationId, roomId: BATHROOM_DEVICE.id },
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.HEAT,
      stateText: 'HEAT',
      runModeInt: RunMode.OVERRIDE,
      runMode: 'override',
      method: 'deviceOverride',
      args: { locationId: BATHROOM_DEVICE.locationId, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.HEAT,
      stateText: 'HEAT',
      runModeInt: undefined,
      runMode: undefined,
      method: 'deviceOverride',
      args: { locationId: BATHROOM_DEVICE.locationId, roomId: BATHROOM_DEVICE.id, temperature: 21.5, minutes: 60 },
    },
  ])(
    'should call $method when the run mode is $runMode and characteristic state is $stateText',
    async ({ state, runModeInt, runMode, method, args }) => {
      // Arrange
      const { TargetHeatingCoolingState, TargetTemperature } = platform.Characteristic;
      jest.spyOn(platform.warmupService, 'getDevice').mockResolvedValue({ ...BATHROOM_DEVICE, runModeInt, runMode });
      jest.spyOn(platform.warmupService, method).mockResolvedValue(true);
      if (args.hasOwnProperty('temperature')) {
        TargetTemperature.value = args.temperature;
      }
      const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
      const thermostat = new WarmupPlatformAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      const result = await thermostat.service.getCharacteristic(TargetHeatingCoolingState).emit('set', state);

      // Assert
      expect(platform.warmupService[method]).toHaveBeenCalledWith(args);
      expect(result).toBeTruthy();
    }
  );
});

describe('TemperatureDisplayUnits', () => {
  it('should get CELSIUS', async () => {
    // Arrange
    const { TemperatureDisplayUnits } = platform.Characteristic;
    jest.fn(WarmupService.prototype, 'getDevice').mockResolvedValue(BATHROOM_DEVICE);
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const thermostat = new WarmupPlatformAccessory(platform, accessory);

    // Act
    const result = await thermostat.service.getCharacteristic(TemperatureDisplayUnits).emit('get');

    // Assert
    expect(result).toBe(TemperatureDisplayUnits.CELSIUS);
  });

  it('should throw when set', async () => {
    // Arrange
    const { TemperatureDisplayUnits } = platform.Characteristic;
    jest.fn(platform.warmupService, 'getDevice').mockResolvedValue(BATHROOM_DEVICE);
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const thermostat = new WarmupPlatformAccessory(platform, accessory);
    platform.warmupService.token = 'logged in';

    // Act & Assert
    await expect(
      async () =>
        await thermostat.service.getCharacteristic(TemperatureDisplayUnits).emit('set', TemperatureDisplayUnits.CELSIUS)
    ).rejects.toThrow(api.hap.HapStatusError(api.hap.HAPStatus.READ_ONLY_CHARACTERISTIC));
  });
});

describe('TargetTemperature', () => {
  it.each([
    { runModeInt: RunMode.OFF, runMode: 'off', overrideTemp: 250, targetTemp: 230, expected: 23 },
    { runModeInt: RunMode.SCHEDULE, runMode: 'schedule', overrideTemp: 250, targetTemp: 230, expected: 23 },
    { runModeInt: RunMode.FIXED, runMode: 'fixed', overrideTemp: 250, targetTemp: 230, expected: 23 },
    { runModeInt: RunMode.OVERRIDE, runMode: 'override', overrideTemp: 250, targetTemp: 230, expected: 25 },
    { runModeInt: undefined, runMode: undefined, overrideTemp: 250, targetTemp: 230, expected: 23 },
  ])(
    'should get the target temperature of $expected when run mode is $runMode',
    async ({ runModeInt, runMode, overrideTemp, targetTemp, expected }) => {
      // Arrange
      const { TargetTemperature } = platform.Characteristic;
      jest
        .spyOn(WarmupService.prototype, 'getDevice')
        .mockResolvedValue({ ...BATHROOM_DEVICE, runModeInt, runMode, overrideTemp, targetTemp });
      const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
      const thermostat = new WarmupPlatformAccessory(platform, accessory);

      // Act
      const result = await thermostat.service.getCharacteristic(TargetTemperature).emit('get');

      // Assert
      expect(result).toBe(expected);
    }
  );

  it.each([
    {
      runModeInt: RunMode.SCHEDULE,
      runMode: 'schedule',
      method: 'deviceOverride',
      args: { locationId: BATHROOM_DEVICE.locationId, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
    },
    {
      runModeInt: RunMode.FIXED,
      runMode: 'fixed',
      method: 'deviceOverride',
      args: { locationId: BATHROOM_DEVICE.locationId, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
    },
    {
      runModeInt: RunMode.OVERRIDE,
      runMode: 'override',
      method: 'deviceOverride',
      args: { locationId: BATHROOM_DEVICE.locationId, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
    },
  ])('should call $method when the run mode is $runMode', async ({ runModeInt, runMode, method, args }) => {
    // Arrange
    const { TargetTemperature } = platform.Characteristic;
    jest.spyOn(platform.warmupService, 'getDevice').mockResolvedValue({ ...BATHROOM_DEVICE, runModeInt, runMode });
    jest.spyOn(platform.warmupService, method).mockResolvedValue(true);
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const thermostat = new WarmupPlatformAccessory(platform, accessory);
    platform.warmupService.token = 'logged in';

    // Act
    const result = await thermostat.service.getCharacteristic(TargetTemperature).emit('set', args.temperature / 10);

    // Assert
    expect(platform.warmupService[method]).toHaveBeenCalledWith(args);
    expect(result).toBeTruthy();
  });

  it.each([
    {
      runModeInt: RunMode.OFF,
      runMode: 'off',
      method: 'deviceOverride',
      args: { locationId: BATHROOM_DEVICE.locationId, roomId: BATHROOM_DEVICE.id, temperature: 185, minutes: 60 },
      // throws is a function as api is not available until the test is running
      throws: () => api.hap.HapStatusError(api.hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE),
    },
    {
      runModeInt: undefined,
      runMode: undefined,
      method: 'deviceOverride',
      args: { locationId: BATHROOM_DEVICE.locationId, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
      // throws is a function as api is not available until the test is running
      throws: () => api.hap.HapStatusError(api.hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE),
    },
  ])('should not call $method when the run mode is $runMode', async ({ runModeInt, runMode, method, args, throws }) => {
    // Arrange
    const { TargetTemperature } = platform.Characteristic;
    jest.spyOn(platform.warmupService, 'getDevice').mockResolvedValue({ ...BATHROOM_DEVICE, runModeInt, runMode });
    jest.spyOn(platform.warmupService, method).mockResolvedValue(true);
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const thermostat = new WarmupPlatformAccessory(platform, accessory);
    platform.warmupService.token = 'logged in';

    // Act & Assert
    await expect(
      async () => await thermostat.service.getCharacteristic(TargetTemperature).emit('set', args.temperature / 10)
    ).rejects.toThrow(throws());
    expect(platform.warmupService[method]).not.toHaveBeenCalled();
  });
});

describe('CurrentTemperature', () => {
  it('should get the current temperature', async () => {
    // Arrange
    const { CurrentTemperature } = platform.Characteristic;
    const currentTemp = 215;
    jest.spyOn(WarmupService.prototype, 'getDevice').mockResolvedValue({ ...BATHROOM_DEVICE, currentTemp });
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const thermostat = new WarmupPlatformAccessory(platform, accessory);

    // Act
    const result = await thermostat.service.getCharacteristic(CurrentTemperature).emit('get');

    // Assert
    expect(result).toBe(currentTemp / 10);
  });
});
