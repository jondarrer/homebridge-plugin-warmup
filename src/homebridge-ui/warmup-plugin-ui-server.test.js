// HomebridgePluginUiServer uses setInterval to determine whether its still
// connected. We don't want any open handles after running our tests.
// See https://github.com/homebridge/plugin-ui-utils/blob/latest/src/server.ts#L190
import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert';

class MockedHomebridgePluginUiServer {
  handlers = {};

  onRequest(path, fn) {
    this.handlers[path] = fn;
  }

  ready() {}
}

class MockedRequestError extends Error {
  requestError;
  constructor(message, requestError) {
    super(message);
    Object.setPrototypeOf(this, MockedRequestError.prototype);
    this.requestError = requestError;
  }
}

afterEach(async () => {
  // Restore the original implementation
  mock.reset();
});

describe('/token', () => {
  it('should return the login token when given valid credentials', async (t) => {
    // Arrange
    const email = 'email@address';
    const password = 'password-123';
    t.mock.module('@homebridge/plugin-ui-utils', {
      namedExports: { HomebridgePluginUiServer: MockedHomebridgePluginUiServer, RequestError: MockedRequestError },
    });
    const { default: WarmupPluginUiServer } = await import('./warmup-plugin-ui-server.js');
    const server = new WarmupPluginUiServer();
    t.mock.method(server.warmupService, 'login', async () => Promise.resolve());
    server.warmupService.token = 'valid-token';

    // Act
    // const { token } = await server.handlers['/token']({ email, password });
    const { token } = await server.generateToken({ email, password });

    // Assert
    t.mock.timers.enable({ apis: ['setInterval'] });
    t.mock.timers.tick(1);
    assert.equal(server.warmupService.login.mock.callCount(), 1);
    assert.deepEqual(server.warmupService.login.mock.calls[0].arguments, [email, password]);
    assert.equal(token, 'valid-token');
  });

  it('should throw an error when login fails', async (t) => {
    // Arrange
    const email = 'email@address';
    const password = 'password-123';
    t.mock.module('@homebridge/plugin-ui-utils', {
      namedExports: { HomebridgePluginUiServer: MockedHomebridgePluginUiServer, RequestError: MockedRequestError },
    });
    const { default: WarmupPluginUiServer } = await import('./warmup-plugin-ui-server.js');
    const server = new WarmupPluginUiServer();
    t.mock.method(server.warmupService, 'login', async () => Promise.reject(new Error('An error occurred')));

    // Act & Assert
    t.mock.timers.enable({ apis: ['setInterval'] });
    t.mock.timers.tick(1);
    await assert.rejects(
      async () => await server.generateToken({ email, password }),
      // async () => await server.handlers['/token']({ email, password }),
      new MockedRequestError('Failed to get token', 'An error occurred')
    );
  });
});

describe('/user-profile', () => {
  it('should return the login token when given valid credentials', async (t) => {
    // Arrange
    const token = 'valid-token';
    const email = 'email@address';
    const firstName = 'Joe';
    const lastName = 'Bloggs';
    t.mock.module('@homebridge/plugin-ui-utils', {
      namedExports: { HomebridgePluginUiServer: MockedHomebridgePluginUiServer, RequestError: MockedRequestError },
    });
    const { default: WarmupPluginUiServer } = await import('./warmup-plugin-ui-server.js');
    const server = new WarmupPluginUiServer();
    t.mock.method(server.warmupService, 'getUserProfile', async () =>
      Promise.resolve({ user: { userProfile: { email, firstName, lastName } } })
    );
    server.warmupService.token = 'valid-token';

    // Act
    // const { user } = await server.handlers['/user-profile']({ token });
    const { user } = await server.getUserProfile({ token });

    // Assert
    t.mock.timers.enable({ apis: ['setInterval'] });
    t.mock.timers.tick(1);
    assert.equal(server.warmupService.getUserProfile.mock.callCount(), 1);
    assert.deepEqual(user, { userProfile: { email, firstName, lastName } });
  });

  it('should throw an error when login fails', async (t) => {
    // Arrange
    const token = 'valid-token';
    t.mock.module('@homebridge/plugin-ui-utils', {
      namedExports: { HomebridgePluginUiServer: MockedHomebridgePluginUiServer, RequestError: MockedRequestError },
    });
    const { default: WarmupPluginUiServer } = await import('./warmup-plugin-ui-server.js');
    const server = new WarmupPluginUiServer();
    t.mock.method(server.warmupService, 'getUserProfile', async () => Promise.reject(new Error('An error occurred')));

    // Act & Assert
    t.mock.timers.enable({ apis: ['setInterval'] });
    t.mock.timers.tick(1);
    await assert.rejects(
      // async () => await server.handlers['/user-profile']({ token }),
      async () => await server.getUserProfile({ token }),
      new MockedRequestError('Failed to get token', 'An error occurred')
    );
  });
});
