import { mock } from 'node:test';

import type { Logger } from 'homebridge';

export default (): Logger => ({
  error: mock.fn(),
  warn: mock.fn(),
  log: mock.fn(),
  info: mock.fn(),
  debug: mock.fn(),
  success: mock.fn(),
});