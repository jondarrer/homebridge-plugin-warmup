// HomebridgePluginUiServer uses setInterval to determine whether its still
// connected. We don't want any open handles after running our tests.
// See https://github.com/homebridge/plugin-ui-utils/blob/latest/src/server.ts#L190
jest.useFakeTimers();

import { jest } from '@jest/globals';
import { RequestError } from '@homebridge/plugin-ui-utils';

import WarmupPluginUiServer from './warmup-plugin-ui-server.js';

let server;

beforeEach(() => {
  server = new WarmupPluginUiServer();
  jest.restoreAllMocks();
});

describe('/token', () => {
  it('should return the login token when given valid credentials', async () => {
    // Arrange
    const email = 'email@address';
    const password = 'password-123';
    jest.spyOn(server.warmupService, 'login').mockResolvedValue();
    server.warmupService.token = 'valid-token';

    // Act
    const { token } = await server.handlers['/token']({ email, password });

    // Assert
    jest.runAllTimers();
    expect(server.warmupService.login).toHaveBeenCalledWith(email, password);
    expect(token).toBe('valid-token');
  });

  it('should throw an error when login fails', async () => {
    // Arrange
    const email = 'email@address';
    const password = 'password-123';
    jest.spyOn(server.warmupService, 'login').mockRejectedValue(new Error('An error occurred'));

    // Act & Assert
    jest.runAllTimers();
    await expect(async () => await server.handlers['/token']({ email, password })).rejects.toThrow(
      new RequestError('Failed to get token', { message: 'An error occurred' })
    );
  });
});

describe('/user-profile', () => {
  it('should return the login token when given valid credentials', async () => {
    // Arrange
    const token = 'valid-token';
    const email = 'email@address';
    const firstName = 'Joe';
    const lastName = 'Bloggs';
    jest
      .spyOn(server.warmupService, 'getUserProfile')
      .mockResolvedValue({ user: { userProfile: { email, firstName, lastName } } });
    server.warmupService.token = 'valid-token';

    // Act
    const { user } = await server.handlers['/user-profile']({ token });

    // Assert
    jest.runAllTimers();
    expect(server.warmupService.getUserProfile).toHaveBeenCalled();
    expect(user).toEqual({ userProfile: { email, firstName, lastName } });
  });

  it('should throw an error when login fails', async () => {
    // Arrange
    const email = 'email@address';
    const password = 'password-123';
    jest.spyOn(server.warmupService, 'login').mockRejectedValue(new Error('An error occurred'));

    // Act & Assert
    jest.runAllTimers();
    await expect(async () => await server.handlers['/token']({ email, password })).rejects.toThrow(
      new RequestError('Failed to get token', { message: 'An error occurred' })
    );
  });
});
