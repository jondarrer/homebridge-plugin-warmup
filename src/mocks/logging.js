import { mock } from 'node:test';

export default () => ({
  error: mock.fn(),
  warn: mock.fn(),
  info: mock.fn(),
  debug: mock.fn(),
});
