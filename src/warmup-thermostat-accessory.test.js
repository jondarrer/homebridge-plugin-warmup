import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import { HomebridgeMock, CharacteristicMock, createLoggingMock } from './mocks/index.js';

import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js';
import { RunMode } from './enums.js';
import { WarmupService } from './services/index.js';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';
import { WarmupThermostatAccessory } from './warmup-thermostat-accessory.js';

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
  ].forEach(({ runModeInt, runMode, expected, expectedText }) => {
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
      };
      const thermostat = new WarmupThermostatAccessory(platform, accessory);

      // Act
      const result = await thermostat.service.getCharacteristic(CurrentHeatingCoolingState).emit('get');

      // Assert
      assert.deepEqual(result, expected);
    });
  });
});

describe('TargetHeatingCoolingState', () => {
  it('should set valid values to OFF, HEAT and AUTO', async (t) => {
    // Arrange
    const { TargetHeatingCoolingState } = platform.Characteristic;
    mock.method(TargetHeatingCoolingState, 'setProps');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    };

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.deepEqual(TargetHeatingCoolingState.setProps.mock.callCount(), 1);
    assert.deepEqual(TargetHeatingCoolingState.setProps.mock.calls[0].arguments, [
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
  ].forEach(({ runModeInt, runMode, expected, expectedText }) => {
    it(`should set the initial state to ${expectedText} when run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetHeatingCoolingState } = platform.Characteristic;
      mock.method(TargetHeatingCoolingState, 'updateValue');
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
        context: {
          userId: USER_ID,
          locationId: LOCATION_ID,
          device: { ...BATHROOM_DEVICE, runModeInt, runMode },
        },
      };

      // Act
      new WarmupThermostatAccessory(platform, accessory);

      // Assert
      assert.deepEqual(TargetHeatingCoolingState.updateValue.mock.callCount(), 1);
      assert.deepEqual(TargetHeatingCoolingState.updateValue.mock.calls[0].arguments, [expected]);
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
  ].forEach(({ runModeInt, runMode, expected, expectedText }) => {
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
      };
      const thermostat = new WarmupThermostatAccessory(platform, accessory);

      // Act
      const result = await thermostat.service.getCharacteristic(TargetHeatingCoolingState).emit('get');

      // Assert
      assert.deepEqual(result, expected);
    });
  });

  [
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
  ].forEach(({ state, stateText, runModeInt, runMode, method, args }) => {
    it(`should call ${method} when the run mode is ${runMode} and characteristic state is ${stateText}`, async (t) => {
      // Arrange
      const { TargetHeatingCoolingState, TargetTemperature } = platform.Characteristic;
      t.mock.method(platform.warmupService, 'getDevice', async () =>
        Promise.resolve({
          data: { user: { owned: [{ room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
        })
      );
      t.mock.method(platform.warmupService, method, async () => Promise.resolve());
      if (args.hasOwnProperty('temperature')) {
        TargetTemperature.value = args.temperature / 10;
      }
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
      };
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      await thermostat.service.getCharacteristic(TargetHeatingCoolingState).emit('set', state);

      // Assert
      assert.equal(platform.warmupService[method].mock.callCount(), 1);
      assert.deepEqual(platform.warmupService[method].mock.calls[0].arguments, [args]);
    });
  });

  [
    {
      state: CharacteristicMock.TargetHeatingCoolingState.AUTO,
      method: 'deviceOverrideCancel',
      expected: 17.5,
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.AUTO,
      method: 'deviceOverrideCancel',
      expected: 18.5,
    },
    {
      state: CharacteristicMock.TargetHeatingCoolingState.AUTO,
      method: 'deviceOverrideCancel',
      expected: 19.5,
    },
  ].forEach(({ state, method, expected }) => {
    it(`should update the target temperature ${expected} when run mode is ${state}`, async (t) => {
      // Arrange
      const { TargetHeatingCoolingState, TargetTemperature } = platform.Characteristic;
      mock.method(TargetTemperature, 'updateValue');
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
      };
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      await thermostat.service.getCharacteristic(TargetHeatingCoolingState).emit('set', state);

      // Assert
      assert.ok(TargetTemperature.updateValue.mock.callCount() > 0);
      assert.deepEqual(TargetTemperature.updateValue.mock.calls[0].arguments, [expected]);
    });
  });
});

describe('TemperatureDisplayUnits', () => {
  it('should set valid values to CELSIUS', async (t) => {
    // Arrange
    const { TemperatureDisplayUnits } = platform.Characteristic;
    mock.method(TemperatureDisplayUnits, 'setProps');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    };

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.equal(TemperatureDisplayUnits.setProps.mock.callCount(), 1);
    assert.deepEqual(TemperatureDisplayUnits.setProps.mock.calls[0].arguments, [
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
    mock.method(TemperatureDisplayUnits, 'onGet');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    };
    const thermostat = new WarmupThermostatAccessory(platform, accessory);

    // Act
    const result = await thermostat.service.getCharacteristic(TemperatureDisplayUnits).emit('get');

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
    };
    const thermostat = new WarmupThermostatAccessory(platform, accessory);
    platform.warmupService.token = 'logged in';

    // Act & Assert
    await assert.rejects(
      async () =>
        await thermostat.service
          .getCharacteristic(TemperatureDisplayUnits)
          .emit('set', TemperatureDisplayUnits.CELSIUS),
      api.hap.HapStatusError(api.hap.HAPStatus.READ_ONLY_CHARACTERISTIC)
    );
  });
});

describe('TargetTemperature', () => {
  it('should set the initial target temperature', async (t) => {
    // Arrange
    const targetTemp = 100;
    const { TargetTemperature } = platform.Characteristic;
    t.mock.method(TargetTemperature, 'updateValue');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, targetTemp },
      },
    };

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.equal(TargetTemperature.updateValue.mock.callCount(), 1);
    assert.deepEqual(TargetTemperature.updateValue.mock.calls[0].arguments, [targetTemp / 10]);
  });

  it('should set min to 5 and max to 30', async (t) => {
    // Arrange
    const { TargetTemperature } = platform.Characteristic;
    mock.method(TargetTemperature, 'setProps');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
    };

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.equal(TargetTemperature.setProps.mock.callCount(), 1);
    assert.deepEqual(TargetTemperature.setProps.mock.calls[0].arguments, [
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
      };
      const thermostat = new WarmupThermostatAccessory(platform, accessory);

      // Act
      const result = await thermostat.service.getCharacteristic(TargetTemperature).emit('get');

      // Assert
      assert.equal(result, expected);
    });
  });

  [
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
  ].forEach(({ runModeInt, runMode, method, args }) => {
    it(`should call ${method} when the run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetTemperature } = platform.Characteristic;
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
      };
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      await thermostat.service.getCharacteristic(TargetTemperature).emit('set', args.temperature / 10);

      // Assert
      assert.equal(platform.warmupService[method].mock.callCount(), 1);
      assert.deepEqual(platform.warmupService[method].mock.calls[0].arguments, [args]);
    });
  });

  [
    {
      runModeInt: RunMode.SCHEDULE,
      runMode: 'schedule',
      method: 'deviceOverride',
      temperature: 19.5,
    },
    {
      runModeInt: RunMode.OVERRIDE,
      runMode: 'override',
      method: 'deviceOverride',
      temperature: 19.5,
    },
  ].forEach(({ runModeInt, runMode, method, temperature }) => {
    it(`should update the target heating cooling state to HEAT when run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetHeatingCoolingState, TargetTemperature } = platform.Characteristic;
      t.mock.method(TargetHeatingCoolingState, 'updateValue');
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
      };
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act
      await thermostat.service.getCharacteristic(TargetTemperature).emit('set', temperature);

      // Assert
      // TODO: Fix this - it's relying on the second call, and should rely on the first call
      assert.ok(TargetHeatingCoolingState.updateValue.mock.callCount() > 0);
      assert.deepEqual(TargetHeatingCoolingState.updateValue.mock.calls[1].arguments, [TargetHeatingCoolingState.HEAT]);
    });
  });

  [
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
  ].forEach(({ runModeInt, runMode, method, args, throws }) => {
    it(`should not call ${method} when the run mode is ${runMode}`, async (t) => {
      // Arrange
      const { TargetTemperature } = platform.Characteristic;
      t.mock.method(platform.warmupService, 'getDevice', async () =>
        Promise.resolve({
          data: { user: { owned: [{ id: LOCATION_ID, room: { ...BATHROOM_DEVICE, runModeInt, runMode } }] } },
        })
      );
      t.mock.method(platform.warmupService, method, async () => Promise.resolve(true));
      const accessory = {
        ...BATHROOM_ACCESSORY,
        getService: t.mock.fn((service) => service),
      };
      const thermostat = new WarmupThermostatAccessory(platform, accessory);
      platform.warmupService.token = 'logged in';

      // Act & Assert
      await assert.rejects(
        async () => await thermostat.service.getCharacteristic(TargetTemperature).emit('set', args.temperature / 10)
      );
      assert.equal(platform.warmupService[method].mock.callCount(), 0);
    });
  });
});

describe('CurrentTemperature', () => {
  it('should set the initial current temperature', async (t) => {
    // Arrange
    const currentTemp = 100;
    const { CurrentTemperature } = platform.Characteristic;
    t.mock.method(CurrentTemperature, 'updateValue');
    const accessory = {
      ...BATHROOM_ACCESSORY,
      getService: t.mock.fn((service) => service),
      context: {
        userId: USER_ID,
        locationId: LOCATION_ID,
        device: { ...BATHROOM_DEVICE, currentTemp },
      },
    };

    // Act
    new WarmupThermostatAccessory(platform, accessory);

    // Assert
    assert.deepEqual(CurrentTemperature.updateValue.mock.callCount(), 1);
    assert.deepEqual(CurrentTemperature.updateValue.mock.calls[0].arguments, [currentTemp / 10]);
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
    };
    const thermostat = new WarmupThermostatAccessory(platform, accessory);

    // Act
    const result = await thermostat.service.getCharacteristic(CurrentTemperature).emit('get');

    // Assert
    assert.equal(result, currentTemp / 10);
  });
});
