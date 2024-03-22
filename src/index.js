import { PLATFORM_NAME } from './settings.js';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';

/**
 * This method registers the platform with Homebridge
 * @param {import('homebridge').API}
 */
export default (api) => {
  api.registerPlatform(PLATFORM_NAME, WarmupHomebridgePlatform);
};
