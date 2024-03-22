import { PLATFORM_NAME } from './settings';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform';

/**
 * This method registers the platform with Homebridge
 * @param {import('homebridge').API}
 */
export default (api) => {
  api.registerPlatform(PLATFORM_NAME, WarmupHomebridgePlatform);
};
