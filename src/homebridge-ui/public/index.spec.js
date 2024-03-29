import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { jest } from '@jest/globals';
import jsdom from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dom;
let glob = {
  homebridge: null,
};

beforeEach(() => {
  glob.homebridge = {
    getPluginConfig: jest.fn(),
    updatePluginConfig: jest.fn(),
    toast: {
      error: jest.fn(),
      success: jest.fn(),
    },
    showSpinner: jest.fn(),
    hideSpinner: jest.fn(),
    request: jest.fn(),
  };
  jest.restoreAllMocks();
});

afterEach(() => {
  dom.window.close();
});

describe('Logged out', () => {
  it('should add a new plugin config when no token exists yet', async () => {
    // Arrange
    const pluginConfig = [];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    // Assert
    expect(glob.homebridge.getPluginConfig).toHaveBeenCalled();
    expect(pluginConfig.push).toHaveBeenCalledWith({});
  });

  it('should validate the email field', async () => {
    // Arrange
    const pluginConfig = [];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

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
    expect(glob.homebridge.toast.error).toHaveBeenCalledWith('Email must be provided.', 'Error');
  });

  it('should validate the password field', async () => {
    // Arrange
    const pluginConfig = [];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

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
    expect(glob.homebridge.toast.error).toHaveBeenCalledWith('Password must be provided.', 'Error');
  });

  it('should show the spinner', async () => {
    // Arrange
    const pluginConfig = [];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

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
    expect(glob.homebridge.showSpinner).toHaveBeenCalled();
  });

  it('should hide the spinner', async () => {
    // Arrange
    const pluginConfig = [];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

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
    expect(glob.homebridge.hideSpinner).toHaveBeenCalled();
  });

  it('should update the plugin config when successful', async () => {
    // Arrange
    const pluginConfig = [];
    const token = 'valid-token';
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    glob.homebridge.request.mockResolvedValue({ token });
    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    expect(glob.homebridge.updatePluginConfig).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ token })])
    );
    expect(glob.homebridge.toast.success).toHaveBeenCalledWith('Logged in', 'Success');
  });

  it('should handle the error upon 200 failure', async () => {
    // Arrange
    const pluginConfig = [];
    const token = 'valid-token';
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    glob.homebridge.request.mockResolvedValue({ error: 'some error' });
    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    expect(glob.homebridge.updatePluginConfig).not.toHaveBeenCalled();
    expect(glob.homebridge.toast.error).toHaveBeenCalledWith(undefined, 'some error');
  });

  it('should handle the error upon error thrown failure', async () => {
    // Arrange
    const pluginConfig = [];
    const token = 'valid-token';
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    glob.homebridge.request.mockRejectedValue(new Error('Some error has occurred'));
    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    expect(glob.homebridge.updatePluginConfig).not.toHaveBeenCalled();
    expect(glob.homebridge.toast.error).toHaveBeenCalledWith(undefined, 'Some error has occurred');
  });

  it('should handle the error thrown by updatePluginConfig', async () => {
    // Arrange
    const pluginConfig = [];
    const token = 'valid-token';
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });
    glob.homebridge.updatePluginConfig.mockRejectedValue(new Error('updatePluginConfig threw this error'));

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    glob.homebridge.request.mockResolvedValue({ token });
    dom.window.document.getElementById('email').value = 'some@email';
    dom.window.document.getElementById('password').value = 'password-123';
    dom.window.document.getElementById('loginButton').click();
    await wait();

    // Assert
    expect(glob.homebridge.toast.error).toHaveBeenCalledWith(undefined, 'updatePluginConfig threw this error');
  });
});

describe('Logged in', () => {
  it('should add a new plugin config when no token exists yet', async () => {
    // Arrange
    const pluginConfig = [{ token: 'a token' }];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    // Assert
    expect(glob.homebridge.getPluginConfig).toHaveBeenCalled();
    expect(dom.window.document.getElementById('loginForm').classList.contains('d-none')).toBeTruthy();
    expect(dom.window.document.getElementById('logoutForm').classList.contains('d-none')).toBeFalsy();
  });

  it('should show the spinner', async () => {
    // Arrange
    const pluginConfig = [{ token: 'a token' }];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

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
    expect(glob.homebridge.showSpinner).toHaveBeenCalled();
  });

  it('should hide the spinner', async () => {
    // Arrange
    const pluginConfig = [{ token: 'a token' }];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

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
    expect(glob.homebridge.hideSpinner).toHaveBeenCalled();
  });

  it('should update the plugin config when successful', async () => {
    // Arrange
    const pluginConfig = [{ token: 'a token' }];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });

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
    expect(glob.homebridge.updatePluginConfig).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ token: null })])
    );
    expect(glob.homebridge.toast.success).toHaveBeenCalledWith('Logged out', 'Success');
  });

  it('should handle the error thrown by updatePluginConfig', async () => {
    // Arrange
    const pluginConfig = [{ token: 'a token' }];
    jest.spyOn(pluginConfig, 'push');
    glob.homebridge.getPluginConfig.mockResolvedValue(pluginConfig);
    const page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });
    glob.homebridge.updatePluginConfig.mockRejectedValue(new Error('updatePluginConfig threw this error'));

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
    expect(glob.homebridge.toast.error).toHaveBeenCalledWith(undefined, 'updatePluginConfig threw this error');
  });
});

const wait = (millis = 0) => new Promise((resolve) => setTimeout(resolve, millis));
