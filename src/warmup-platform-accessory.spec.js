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
    jest.spyOn(WarmupService.prototype, 'getDevice').mockResolvedValue({
      data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
    });
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const thermostat = new WarmupPlatformAccessory(platform, accessory);

    // Act
    const result = await thermostat.service.getCharacteristic(CurrentHeatingCoolingState).emit('get');

    // Assert
    expect(result).toBe(expected);
  });
});

describe('TargetHeatingCoolingState', () => {
  it('should set valid values to OFF, HEAT and AUTO', async () => {
    // Arrange
    const { TargetHeatingCoolingState } = platform.Characteristic;
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);

    // Act
    new WarmupPlatformAccessory(platform, accessory);

    // Assert
    expect(TargetHeatingCoolingState.setProps).toHaveBeenCalledWith({
      validValues: [TargetHeatingCoolingState.OFF, TargetHeatingCoolingState.HEAT, TargetHeatingCoolingState.AUTO],
    });
  });

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
  ])(
    'should set the initial state to $expectedText when run mode is $runMode',
    async ({ runModeInt, runMode, expected }) => {
      // Arrange
      const { TargetHeatingCoolingState } = platform.Characteristic;
      const accessory = api.platformAccessory({
        ...BATHROOM_ACCESSORY,
        context: {
          userId: USER_ID,
          locationId: LOCATION_ID,
          device: { ...BATHROOM_DEVICE, runModeInt, runMode },
        },
      });

      // Act
      new WarmupPlatformAccessory(platform, accessory);

      // Assert
      expect(TargetHeatingCoolingState.updateValue).toHaveBeenCalledWith(expected);
    }
  );

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
    jest.spyOn(platform.warmupService, 'getDevice').mockResolvedValue({
      data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
    });
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
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id },
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.AUTO,
      stateText: 'AUTO',
      runModeInt: RunMode.SCHEDULE,
      runMode: 'schedule',
      method: 'deviceOverrideCancel',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id },
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.HEAT,
      stateText: 'HEAT',
      runModeInt: RunMode.OVERRIDE,
      runMode: 'override',
      method: 'deviceOverride',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.HEAT,
      stateText: 'HEAT',
      runModeInt: undefined,
      runMode: undefined,
      method: 'deviceOverride',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 21.5, minutes: 60 },
    },
  ])(
    'should call $method when the run mode is $runMode and characteristic state is $stateText',
    async ({ state, runModeInt, runMode, method, args }) => {
      // Arrange
      const { TargetHeatingCoolingState, TargetTemperature } = platform.Characteristic;
      jest.spyOn(platform.warmupService, 'getDevice').mockResolvedValue({
        data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
      });
      jest.spyOn(platform.warmupService, method).mockResolvedValue();
      if (args.hasOwnProperty('temperature')) {
        TargetTemperature.value = args.temperature / 10;
      }
      const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
      const thermostat = new WarmupPlatformAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      const result = await thermostat.service.getCharacteristic(TargetHeatingCoolingState).emit('set', state);

      // Assert
      expect(platform.warmupService[method]).toHaveBeenCalledWith(args);
    }
  );
});

describe('TemperatureDisplayUnits', () => {
  it('should set valid values to CELSIUS', async () => {
    // Arrange
    const { TemperatureDisplayUnits } = platform.Characteristic;
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);

    // Act
    new WarmupPlatformAccessory(platform, accessory);

    // Assert
    expect(TemperatureDisplayUnits.setProps).toHaveBeenCalledWith({
      validValues: [TemperatureDisplayUnits.CELSIUS],
    });
  });
  it('should get CELSIUS', async () => {
    // Arrange
    const { TemperatureDisplayUnits } = platform.Characteristic;
    jest
      .fn(WarmupService.prototype, 'getDevice')
      .mockResolvedValue({ data: { user: { owned: [{ room: { BATHROOM_DEVICE } }] } } });
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
    jest
      .fn(platform.warmupService, 'getDevice')
      .mockResolvedValue({ data: { user: { owned: [{ room: { BATHROOM_DEVICE } }] } } });
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
  it('should set the initial target temperature', async () => {
    // Arrange
    const targetTemp = 100;
    const { TargetTemperature } = platform.Characteristic;
    const accessory = api.platformAccessory({
      ...BATHROOM_ACCESSORY,
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, targetTemp },
      },
    });

    // Act
    new WarmupPlatformAccessory(platform, accessory);

    // Assert
    expect(TargetTemperature.updateValue).toHaveBeenCalledWith(targetTemp / 10);
  });

  it('should set min to 5 and max to 30', async () => {
    // Arrange
    const { TargetTemperature } = platform.Characteristic;
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);

    // Act
    new WarmupPlatformAccessory(platform, accessory);

    // Assert
    expect(TargetTemperature.setProps).toHaveBeenCalledWith({
      minValue: 5,
      maxValue: 30,
    });
  });
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
      jest.spyOn(WarmupService.prototype, 'getDevice').mockResolvedValue({
        data: {
          user: {
            owned: [{ id: LOCATION_ID, room: { ...BATHROOM_DEVICE, runModeInt, runMode, overrideTemp, targetTemp } }],
          },
        },
      });
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
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
    },
    {
      runModeInt: RunMode.OVERRIDE,
      runMode: 'override',
      method: 'deviceOverride',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
    },
  ])('should call $method when the run mode is $runMode', async ({ runModeInt, runMode, method, args }) => {
    // Arrange
    const { TargetTemperature } = platform.Characteristic;
    jest.spyOn(platform.warmupService, 'getDevice').mockResolvedValue({
      data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
    });
    jest.spyOn(platform.warmupService, method).mockResolvedValue();
    const accessory = api.platformAccessory({
      ...BATHROOM_ACCESSORY,
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, runModeInt, runMode },
      },
    });
    const thermostat = new WarmupPlatformAccessory(platform, accessory);
    platform.warmupService.token = 'logged in';

    // Act
    const result = await thermostat.service.getCharacteristic(TargetTemperature).emit('set', args.temperature / 10);

    // Assert
    expect(platform.warmupService[method]).toHaveBeenCalledWith(args);
  });

  it.each([
    {
      runModeInt: RunMode.FIXED,
      runMode: 'fixed',
      method: 'deviceOverride',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
      // throws is a function as api is not available until the test is running
      throws: () => api.hap.HapStatusError(api.hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE),
    },
    {
      runModeInt: RunMode.OFF,
      runMode: 'off',
      method: 'deviceOverride',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 185, minutes: 60 },
      // throws is a function as api is not available until the test is running
      throws: () => api.hap.HapStatusError(api.hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE),
    },
    {
      runModeInt: undefined,
      runMode: undefined,
      method: 'deviceOverride',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
      // throws is a function as api is not available until the test is running
      throws: () => api.hap.HapStatusError(api.hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE),
    },
  ])('should not call $method when the run mode is $runMode', async ({ runModeInt, runMode, method, args, throws }) => {
    // Arrange
    const { TargetTemperature } = platform.Characteristic;
    jest.spyOn(platform.warmupService, 'getDevice').mockResolvedValue({
      data: { user: { owned: [{ id: LOCATION_ID, room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
    });
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
  it('should set the initial current temperature', async () => {
    // Arrange
    const currentTemp = 100;
    const { CurrentTemperature } = platform.Characteristic;
    const accessory = api.platformAccessory({
      ...BATHROOM_ACCESSORY,
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, currentTemp },
      },
    });

    // Act
    new WarmupPlatformAccessory(platform, accessory);

    // Assert
    expect(CurrentTemperature.updateValue).toHaveBeenCalledWith(currentTemp / 10);
  });
  it('should get the current temperature', async () => {
    // Arrange
    const { CurrentTemperature } = platform.Characteristic;
    const currentTemp = 215;
    jest.spyOn(WarmupService.prototype, 'getDevice').mockResolvedValue({
      data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, currentTemp } }] } },
    });
    const accessory = api.platformAccessory(BATHROOM_ACCESSORY);
    const thermostat = new WarmupPlatformAccessory(platform, accessory);

    // Act
    const result = await thermostat.service.getCharacteristic(CurrentTemperature).emit('get');

    // Assert
    expect(result).toBe(currentTemp / 10);
  });
});
