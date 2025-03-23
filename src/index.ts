import { type API } from 'homebridge';

import { PLATFORM_NAME } from './settings.js';
import { WarmupHomebridgePlatform } from './warmup-homebridge-platform.js';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, WarmupHomebridgePlatform);
};
