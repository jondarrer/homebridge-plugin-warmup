import { describe, it, beforeEach, mock, Mock } from 'node:test';
import assert from 'node:assert';

import { API, Characteristic, Logger, PlatformAccessory } from 'homebridge';

import { CharacteristicMock, createLoggingMock, APIMock } from './mocks/index.js';

import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js';
import { RunMode } from './enums.js';
import { WarmupService } from './services/index.js';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';
import { WarmupThermostatAccessory } from './warmup-thermostat-accessory.js';
import { HAPStatus } from './mocks/hap-mock.js';

let log: Logger;
let config;
let api: API & APIMock;
let platform: WarmupHomebridgePlatform;

type MethodNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type WarmupServiceMethodNames = MethodNames<WarmupService>;

interface IArgs { locationId: number, roomId: number, temperature?: number, minutes?: number };

interface ITestParams {
  runModeInt?: number;
  runMode?: string;
  state?: unknown;
  stateText?: string;
  method?: WarmupServiceMethodNames;
  args?: IArgs;
  expected?: unknown;
  expectedText?: string;
  throws?: () => Error;
}

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
  api = new APIMock() as API & APIMock;
  platform = new WarmupHomebridgePlatform(log, config, api);
  mock.reset();
});

it('should initialise without throwing', () => {
  // Arrange
  const accessory = {
    ...BATHROOM_ACCESSORY,
    getService: mock.fn((service) => service),
  } as unknown as PlatformAccessory;

  // Act & Assert
  assert.doesNotThrow(() => new WarmupThermostatAccessory(platform, accessory));
});

describe('CurrentHeatingCoolingState', () => {
  [
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
  ].forEach(({ runModeInt, runMode, expected, expectedText }: ITestParams) => {
    it(`should get state of ${expectedText} when run mode is ${runMode}`, async (t) => {
      // Arrange
      const { CurrentHeatingCoolingState } = platform.Characteristic;
      t.mock.method(WarmupService.prototype, 'getDevice', async () =>
        Promise.resolve({
          data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
        })
      );
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
      } as unknown as PlatformAccessory;
      const thermostat = new WarmupThermostatAccessory(platform, accessory);

      // Act
      const result = await (thermostat.service.getCharacteristic(CurrentHeatingCoolingState) as unknown as CharacteristicMock).emit('get');

      // Assert
      assert.deepEqual(result, expected);
    });
  });
});

describe('TargetHeatingCoolingState', () => {
  it('should set valid values to OFF, HEAT and AUTO', async (t) => {
    // Arrange
    const { TargetHeatingCoolingState } = platform.Characteristic;
    const mockSetProps = t.mock.method(TargetHeatingCoolingState as unknown as Characteristic, 'setProps');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    } as unknown as PlatformAccessory;

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.deepEqual(mockSetProps.mock.callCount(), 1);
    assert.deepEqual(mockSetProps.mock.calls[0].arguments, [
      {
        validValues: [TargetHeatingCoolingState.OFF, TargetHeatingCoolingState.HEAT, TargetHeatingCoolingState.AUTO],
      },
    ]);
  });

  [
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
  ].forEach(({ runModeInt, runMode, expected, expectedText }: ITestParams) => {
    it(`should set the initial state to ${expectedText} when run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetHeatingCoolingState } = platform.Characteristic;
      const mockUpdateValue = mock.method(TargetHeatingCoolingState as unknown as Characteristic, 'updateValue');
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
        context: {
          userId: USER_ID,
          locationId: LOCATION_ID,
          device: { ...BATHROOM_DEVICE, runModeInt, runMode },
        },
      } as unknown as PlatformAccessory;

      // Act
      new WarmupThermostatAccessory(platform, accessory);

      // Assert
      assert.deepEqual(mockUpdateValue.mock.callCount(), 1);
      assert.deepEqual(mockUpdateValue.mock.calls[0].arguments, [expected]);
    });
  });

  [
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
  ].forEach(({ runModeInt, runMode, expected, expectedText }: ITestParams) => {
    it(`should get state as ${expectedText} when run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetHeatingCoolingState } = platform.Characteristic;
      t.mock.method(platform.warmupService, 'getDevice', async () =>
        Promise.resolve({
          data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
        })
      );
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
      } as unknown as PlatformAccessory;
      const thermostat = new WarmupThermostatAccessory(platform, accessory);

      // Act
      const result = await (thermostat.service.getCharacteristic(TargetHeatingCoolingState) as unknown as CharacteristicMock).emit('get');

      // Assert
      assert.deepEqual(result, expected);
    });
  });

  const tests1 = [
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
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 215, minutes: 60 },
    },
  ] as const;
  
  tests1.forEach(({ state, stateText, runModeInt, runMode, method, args }) => {
    it(`should call ${method} when the run mode is ${runMode} and characteristic state is ${stateText}`, async (t) => {
      // Arrange
      const { TargetHeatingCoolingState, TargetTemperature } = platform.Characteristic;
      let targetTemp: number = 0;
      if (args?.hasOwnProperty('temperature')) {
        targetTemp = (args as { readonly temperature: number }).temperature as number;
        (TargetTemperature as unknown as CharacteristicMock).value = targetTemp / 10;
      }
      t.mock.method(platform.warmupService, 'getDevice', async () =>
        Promise.resolve({
          data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, ...{ targetTemp }, runModeInt, runMode } }] } },
        })
      );
      const mockMethod = t.mock.method(platform.warmupService, method, async () => Promise.resolve());
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
      } as unknown as PlatformAccessory;
      accessory.context.device.targetTemp = targetTemp;
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      await (thermostat.service.getCharacteristic(TargetHeatingCoolingState) as unknown as CharacteristicMock).emit('set', state);

      // Assert
      assert.equal(mockMethod.mock.callCount(), 1);
      assert.deepEqual(mockMethod.mock.calls[0].arguments, [args]);
    });
  });

  const tests2 = [
    {
      state: CharacteristicMock.TargetHeatingCoolingState.AUTO,
      method: 'deviceOverrideCancel' as WarmupServiceMethodNames,
      expected: 17.5,
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.AUTO,
      method: 'deviceOverrideCancel' as WarmupServiceMethodNames,
      expected: 18.5,
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.AUTO,
      method: 'deviceOverrideCancel' as WarmupServiceMethodNames,
      expected: 19.5,
    },
  ] as const;
  
  tests2.forEach(({ state, method, expected }) => {
    it(`should update the target temperature ${expected} when run mode is ${state}`, async (t) => {
      // Arrange
      const { TargetHeatingCoolingState, TargetTemperature } = platform.Characteristic;
      const mockUpdateValue = t.mock.method(TargetTemperature as unknown as Characteristic, 'updateValue');
      t.mock.method(platform.warmupService, 'getDevice', async () =>
        Promise.resolve({
          data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, targetTemp: expected * 10 } }] } },
        })
      );
      t.mock.method(platform.warmupService, method, async () => Promise.resolve());
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
        context: {
          userId: USER_ID,
          locationId: LOCATION_ID,
          device: { ...BATHROOM_DEVICE, targetTemp: expected * 10 },
        },
      } as unknown as PlatformAccessory;
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      await (thermostat.service.getCharacteristic(TargetHeatingCoolingState) as unknown as CharacteristicMock).emit('set', state);

      // Assert
      assert.ok(mockUpdateValue.mock.callCount() > 0);
      assert.deepEqual(mockUpdateValue.mock.calls[0].arguments, [expected]);
    });
  });
});

describe('TemperatureDisplayUnits', () => {
  it('should set valid values to CELSIUS', async (t) => {
    // Arrange
    const { TemperatureDisplayUnits } = platform.Characteristic;
    const mockSetProps = t.mock.method(TemperatureDisplayUnits as unknown as Characteristic, 'setProps');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    } as unknown as PlatformAccessory;

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.equal(mockSetProps.mock.callCount(), 1);
    assert.deepEqual(mockSetProps.mock.calls[0].arguments, [
      {
        validValues: [TemperatureDisplayUnits.CELSIUS],
      },
    ]);
  });
  it('should get CELSIUS', async (t) => {
    // Arrange
    const { TemperatureDisplayUnits } = platform.Characteristic;
    t.mock.method(WarmupService.prototype, 'getDevice', async () =>
      Promise.resolve({ data: { user: { owned: [{ room: { BATHROOM_DEVICE } }] } } })
    );
    t.mock.method(TemperatureDisplayUnits as unknown as Characteristic, 'onGet');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    } as unknown as PlatformAccessory;
    const thermostat = new WarmupThermostatAccessory(platform, accessory);

    // Act
    const result = await (thermostat.service.getCharacteristic(TemperatureDisplayUnits) as unknown as CharacteristicMock).emit('get');

    // Assert
    assert.equal(result, TemperatureDisplayUnits.CELSIUS);
  });

  it('should throw when set', async (t) => {
    // Arrange
    const { TemperatureDisplayUnits } = platform.Characteristic;
    t.mock.method(platform.warmupService, 'getDevice', async () =>
      Promise.resolve({ data: { user: { owned: [{ room: { BATHROOM_DEVICE } }] } } })
    );
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    } as unknown as PlatformAccessory;
    const thermostat = new WarmupThermostatAccessory(platform, accessory);
    platform.warmupService.token = 'logged in';

    // Act & Assert
    await assert.rejects(
      async () =>
        await (thermostat.service
          .getCharacteristic(TemperatureDisplayUnits) as unknown as CharacteristicMock)
          .emit('set', TemperatureDisplayUnits.CELSIUS),
      new api.hap.HapStatusError(HAPStatus.READ_ONLY_CHARACTERISTIC)
    );
  });
});

describe('TargetTemperature', () => {
  it('should set the initial target temperature', async (t) => {
    // Arrange
    const targetTemp = 100;
    const { TargetTemperature } = platform.Characteristic;
    const mockUpdateValue = t.mock.method(TargetTemperature as unknown as Characteristic, 'updateValue');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, targetTemp },
      },
    } as unknown as PlatformAccessory;

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.equal(mockUpdateValue.mock.callCount(), 1);
    assert.deepEqual(mockUpdateValue.mock.calls[0].arguments, [targetTemp / 10]);
  });

  it('should set min to 5 and max to 30', async (t) => {
    // Arrange
    const { TargetTemperature } = platform.Characteristic;
    const mockSetProps = t.mock.method(TargetTemperature as unknown as Characteristic, 'setProps');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    } as unknown as PlatformAccessory;

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.equal(mockSetProps.mock.callCount(), 1);
    assert.deepEqual(mockSetProps.mock.calls[0].arguments, [
      {
        minValue: 5,
        maxValue: 30,
      },
    ]);
  });

  [
    { runModeInt: RunMode.OFF, runMode: 'off', overrideTemp: 250, targetTemp: 230, expected: 23 },
    { runModeInt: RunMode.SCHEDULE, runMode: 'schedule', overrideTemp: 250, targetTemp: 230, expected: 23 },
    { runModeInt: RunMode.FIXED, runMode: 'fixed', overrideTemp: 250, targetTemp: 230, expected: 23 },
    { runModeInt: RunMode.OVERRIDE, runMode: 'override', overrideTemp: 250, targetTemp: 230, expected: 25 },
    { runModeInt: undefined, runMode: undefined, overrideTemp: 250, targetTemp: 230, expected: 23 },
  ].forEach(({ runModeInt, runMode, overrideTemp, targetTemp, expected }) => {
    it(`should get the target temperature of ${expected} when run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetTemperature } = platform.Characteristic;
      t.mock.method(WarmupService.prototype, 'getDevice', async () =>
        Promise.resolve({
          data: {
            user: {
              owned: [{ id: LOCATION_ID, room: { ...BATHROOM_DEVICE, runModeInt, runMode, overrideTemp, targetTemp } }],
            },
          },
        })
      );
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
      } as unknown as PlatformAccessory;
      const thermostat = new WarmupThermostatAccessory(platform, accessory);

      // Act
      const result = await (thermostat.service.getCharacteristic(TargetTemperature) as unknown as CharacteristicMock).emit('get');

      // Assert
      assert.equal(result, expected);
    });
  });

  const tests3 = [
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
  ] as const;

  tests3.forEach(({ runModeInt, runMode, method, args }) => {
    it(`should call ${method} when the run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetTemperature } = platform.Characteristic;
      t.mock.method(platform.warmupService, 'getDevice', async () =>
        Promise.resolve({
          data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
        })
      );
      const mockMethod = t.mock.method(platform.warmupService, method, async () => Promise.resolve());
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
        context: {
          userId: USER_ID,
          locationId: LOCATION_ID,
          device: { ...BATHROOM_DEVICE, runModeInt, runMode },
        },
      } as unknown as PlatformAccessory;
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      await (thermostat.service.getCharacteristic(TargetTemperature) as unknown as CharacteristicMock).emit('set', args.temperature / 10);

      // Assert
      assert.equal(mockMethod.mock.callCount(), 1);
      assert.deepEqual(mockMethod.mock.calls[0].arguments, [args]);
    });
  });

  const tests4 = [
    {
      runModeInt: RunMode.SCHEDULE,
      runMode: 'schedule',
      method: 'deviceOverride',
      temperature: 195,
    },
    {
      runModeInt: RunMode.OVERRIDE,
      runMode: 'override',
      method: 'deviceOverride',
      temperature: 195,
    },
  ] as const;

  tests4.forEach(({ runModeInt, runMode, method, temperature }) => {
    it(`should update the target heating cooling state to HEAT when run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetHeatingCoolingState, TargetTemperature } = platform.Characteristic;
      const mockUpdateValue = t.mock.method(TargetHeatingCoolingState as unknown as Characteristic, 'updateValue');
      t.mock.method(platform.warmupService, 'getDevice', async () =>
        Promise.resolve({
          data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
        })
      );
      t.mock.method(platform.warmupService, method, async () => Promise.resolve());
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
        context: {
          userId: USER_ID,
          locationId: LOCATION_ID,
          device: { ...BATHROOM_DEVICE, runModeInt, runMode },
        },
      } as unknown as PlatformAccessory;
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      await (thermostat.service.getCharacteristic(TargetTemperature) as unknown as CharacteristicMock).emit('set', temperature);

      // Assert
      // TODO: Fix this - it's relying on the second call, and should rely on the first call
      assert.ok(mockUpdateValue.mock.callCount() > 0);
      assert.deepEqual(mockUpdateValue.mock.calls[1].arguments, [TargetHeatingCoolingState.HEAT]);
    });
  });

  const tests5 = [
    {
      runModeInt: RunMode.FIXED,
      runMode: 'fixed',
      method: 'deviceOverride',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
      // throws is a function as api is not available until the test is running
      throws: () => new api.hap.HapStatusError(HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE),
    },
    {
      runModeInt: RunMode.OFF,
      runMode: 'off',
      method: 'deviceOverride',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 185, minutes: 60 },
      // throws is a function as api is not available until the test is running
      throws: () => new api.hap.HapStatusError(HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE),
    },
    {
      runModeInt: undefined,
      runMode: undefined,
      method: 'deviceOverride',
      args: { locationId: LOCATION_ID, roomId: BATHROOM_DEVICE.id, temperature: 195, minutes: 60 },
      // throws is a function as api is not available until the test is running
      throws: () => new api.hap.HapStatusError(HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE),
    },
  ] as const;
  
  tests5.forEach(({ runModeInt, runMode, method, args, throws }) => {
    it(`should not call ${method} when the run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetTemperature } = platform.Characteristic;
      t.mock.method(platform.warmupService, 'getDevice', async () =>
        Promise.resolve({
          data: { user: { owned: [{ id: LOCATION_ID, room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
        })
      );
      const mockMethod = t.mock.method(platform.warmupService, method, async () => Promise.resolve(true));
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
      } as unknown as PlatformAccessory;
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act & Assert
      await assert.rejects(
        async () => await (thermostat.service.getCharacteristic(TargetTemperature) as unknown as CharacteristicMock).emit('set', args.temperature / 10)
      );
      assert.equal(mockMethod.mock.callCount(), 0);
    });
  });
});

describe('CurrentTemperature', () => {
  it('should set the initial current temperature', async (t) => {
    // Arrange
    const currentTemp = 100;
    const { CurrentTemperature } = platform.Characteristic;
    const mockUpdateValue = t.mock.method(CurrentTemperature as unknown as Characteristic, 'updateValue');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, currentTemp },
      },
    } as unknown as PlatformAccessory;

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.deepEqual(mockUpdateValue.mock.callCount(), 1);
    assert.deepEqual(mockUpdateValue.mock.calls[0].arguments, [currentTemp / 10]);
  });
  it('should get the current temperature', async (t) => {
    // Arrange
    const { CurrentTemperature } = platform.Characteristic;
    const currentTemp = 215;
    t.mock.method(WarmupService.prototype, 'getDevice', async () =>
      Promise.resolve({
        data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, currentTemp } }] } },
      })
    );
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    } as unknown as PlatformAccessory;
    const thermostat = new WarmupThermostatAccessory(platform, accessory);

    // Act
    const result = await (thermostat.service.getCharacteristic(CurrentTemperature) as unknown as CharacteristicMock).emit('get');

    // Assert
    assert.equal(result, currentTemp / 10);
  });
});
