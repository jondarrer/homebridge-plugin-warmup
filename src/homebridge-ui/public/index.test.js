import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import jsdom from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dom;
let pluginConfig;
let page;
let glob;

// For debugging purposes, publish the page's console.log statement
// Uncomment the following:
// const virtualConsole = new jsdom.VirtualConsole();
// virtualConsole.sendTo(console);
// virtualConsole.removeAllListeners();

beforeEach((t) => {
  // Setting the mocks here allows us to use mock.reset() in afterEach.
  pluginConfig = {
    length: 0,
    0: {},
    push: t.mock.fn(),
  };
  glob = {
    homebridge: {
      getPluginConfig: t.mock.fn(),
      updatePluginConfig: t.mock.fn(),
      toast: {
        error: t.mock.fn(),
        success: t.mock.fn(),
      },
      showSpinner: t.mock.fn(),
      hideSpinner: t.mock.fn(),
      request: t.mock.fn(),
    },
  };
  glob.homebridge.getPluginConfig.mock.mockImplementation(() => Promise.resolve(pluginConfig));
  page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });
});

afterEach(() => {
  mock.reset();
  dom.window.close();
});

describe('Logged out', () => {
  it('should add a new plugin config when no token exists yet', async () => {
    // Arrange

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    // Assert
    assert.ok(glob.homebridge.getPluginConfig.mock.callCount() > 0);
    assert.deepEqual(pluginConfig.push.mock.calls[0].arguments[0], { name: 'Warmup' });
  });

  it('should validate the email field', async () => {
    // Arrange

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    dom.window.document.getElementById('loginButton').click();

    // Assert
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, ['Email must be provided.', 'Error']);
  });

  it('should validate the password field', async () => {
    // Arrange

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, ['Password must be provided.', 'Error']);
  });

  it('should show the spinner', async () => {
    // Arrange

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.showSpinner.mock.callCount(), 1);
  });

  it('should hide the spinner', async () => {
    // Arrange

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.hideSpinner.mock.callCount(), 1);
  });

  it('should update the plugin config when successful', async () => {
    // Arrange
    const token = 'valid-token';

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    glob.homebridge.request.mock.mockImplementation(() =>
      Promise.resolve({
        token,
      })
    );
    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    assert.ok(glob.homebridge.updatePluginConfig.mock.callCount() > 0);
    assert.deepEqual(glob.homebridge.updatePluginConfig.mock.calls[0].arguments[0]['0'], { token });
    assert.ok(glob.homebridge.toast.success.mock.callCount() > 0);
    assert.deepEqual(glob.homebridge.toast.success.mock.calls[0].arguments, ['Logged in', 'Success']);
  });

  it('should handle the error upon 200 failure', async () => {
    // Arrange

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    glob.homebridge.request.mock.mockImplementation(() =>
      Promise.resolve({
        error: 'some error',
      })
    );
    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.updatePluginConfig.mock.callCount(), 0);
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, [undefined, 'some error']);
  });

  it('should handle the error upon error thrown failure', async () => {
    // Arrange

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    glob.homebridge.request.mock.mockImplementation(() => Promise.reject(new Error('Some error has occurred')));
    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.updatePluginConfig.mock.callCount(), 0);
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, [undefined, 'Some error has occurred']);
  });

  it('should handle the error thrown by updatePluginConfig', async () => {
    // Arrange
    const token = 'valid-token';
    glob.homebridge.updatePluginConfig.mock.mockImplementation(() =>
      Promise.reject(new Error('updatePluginConfig threw this error'))
    );

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    glob.homebridge.request.mock.mockImplementation(() =>
      Promise.resolve({
        token,
      })
    );
    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, [
      undefined,
      'updatePluginConfig threw this error',
    ]);
  });
});

describe('Logged in', () => {
  it('should add a new plugin config when no token exists yet', async () => {
    // Arrange
    pluginConfig.length = 1;
    pluginConfig[0] = { token: 'a token' };

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    // Assert
    assert.equal(glob.homebridge.getPluginConfig.mock.callCount(), 1);
    assert.ok(dom.window.document.getElementById('loginForm').classList.contains('d-none'));
    assert.ok(!dom.window.document.getElementById('logoutForm').classList.contains('d-none'));
  });

  it('should show the spinner', async () => {
    // Arrange
    pluginConfig.length = 1;
    pluginConfig[0] = { token: 'a token' };

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.showSpinner.mock.callCount(), 1);
  });

  it('should hide the spinner', async () => {
    // Arrange
    pluginConfig.length = 1;
    pluginConfig[0] = { token: 'a token' };

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.hideSpinner.mock.callCount(), 1);
  });

  it('should update the plugin config when successful', async () => {
    // Arrange
    const token = 'valid-token';
    const email = 'email@address';
    const firstName = 'Joe';
    const lastName = 'Bloggs';
    pluginConfig.length = 1;
    pluginConfig[0] = { token };
    glob.homebridge.request.mock.mockImplementation(() =>
      Promise.resolve({
        data: {
          user: {
            userProfile: {
              email,
              firstName,
              lastName,
            },
          },
        },
      })
    );

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    dom.window.document.getElementById('logoutButton').click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.updatePluginConfig.mock.callCount(), 1);
    assert.deepEqual(glob.homebridge.updatePluginConfig.mock.calls[0].arguments[0]['0'], { token: null });
    assert.equal(glob.homebridge.toast.success.mock.callCount(), 1);
    assert.deepEqual(glob.homebridge.toast.success.mock.calls[0].arguments, ['Logged out', 'Success']);
  });

  it('should show login information', async () => {
    // Arrange
    const token = 'valid-token';
    const email = 'email@address';
    const firstName = 'Joe';
    const lastName = 'Bloggs';
    pluginConfig.length = 1;
    pluginConfig[0] = { token };
    glob.homebridge.request.mock.mockImplementation(() =>
      Promise.resolve({ data: { user: { userProfile: { email, firstName, lastName } } } })
    );

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    // Assert
    assert.equal(dom.window.document.getElementById('userProfile').innerHTML, `${firstName} ${lastName}, ${email}`);
  });

  it('should handle the error thrown by updatePluginConfig', async () => {
    // Arrange
    const token = 'valid-token';
    const email = 'email@address';
    const firstName = 'Joe';
    const lastName = 'Bloggs';
    pluginConfig.length = 1;
    pluginConfig[0] = { token };
    glob.homebridge.updatePluginConfig.mock.mockImplementation(() =>
      Promise.reject(new Error('updatePluginConfig threw this error'))
    );
    glob.homebridge.request.mock.mockImplementation(() =>
      Promise.resolve({
        data: {
          user: {
            userProfile: {
              email,
              firstName,
              lastName,
            },
          },
        },
      })
    );

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    dom.window.document.getElementById('logoutButton').click();
    await wait();

    // Assert
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, [
      undefined,
      'updatePluginConfig threw this error',
    ]);
  });
});

const wait = (millis = 0) => new Promise((resolve) => setTimeout(resolve, millis));
