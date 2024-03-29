import { jest } from '@jest/globals';
import { RequestError } from '@homebridge/plugin-ui-utils';

import WarmupPluginUiServer from './warmup-plugin-ui-server.js';

let server;

beforeEach(() => {
  server = new WarmupPluginUiServer();
  jest.restoreAllMocks();
});

it('should return the login token when given valid credentials', async () => {
  // Arrange
  const email = 'email@address';
  const password = 'password-123';
  jest.spyOn(server.warmupService, 'login').mockResolvedValue();
  server.warmupService.token = 'valid-token';

  // Act
  const { token } = await server.handlers['/token']({ email, password });

  // Assert
  expect(server.warmupService.login).toHaveBeenCalledWith(email, password);
  expect(token).toBe('valid-token');
});

it('should throw an error when login fails', async () => {
  // Arrange
  const email = 'email@address';
  const password = 'password-123';
  jest.spyOn(server.warmupService, 'login').mockRejectedValue(new Error('An error occurred'));

  // Act & Assert
  await expect(async () => await server.handlers['/token']({ email, password })).rejects.toThrow(
    new RequestError('Failed to get token', { message: 'An error occurred' })
  );
});
