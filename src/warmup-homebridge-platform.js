import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { WarmupPlatformAccessory } from './warmup-platform-accessory.js';
import { WarmupService } from './services/index.js';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 * @implements {import('homebridge').DynamicPlatformPlugin}
 */
export class WarmupHomebridgePlatform {
  /**
   * @type {WarmupService}
   */
  warmupService;

  /**
   * @type {typeof import('homebridge').Service}
   */
  Service;

  /**
   * @type {typeof import('homebridge').Characteristic}
   */
  Characteristic;

  /**
   * @type {typeof import('homebridge').Characteristic}
   */
  Categories;

  /**
   * this is used to track restored cached accessories
   * @type {import('homebridge').PlatformAccessory[]}
   */
  accessories = [];

  /**
   *
   * @param {import('homebridge').Logger} log
   * @param {import('homebridge').PlatformConfig} config
   * @param {import('homebridge').API} api
   */
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;
    this.Categories = this.api.hap.Categories;

    this.warmupService = new WarmupService(this.config.token);
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      this.log.debug('Executing didFinishLaunching callback');

      await this.discoverDevices();
    });
  }

  /**
   * Invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   * @param {import('homebridge').PlatformAccessory} accessory
   */
  configureAccessory = (accessory) => {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  };

  /**
   * Discover and register Warmup thermostats.
   * Accessories must only be registered once, so previously created accessories
   * are not registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices = async () => {
    const { user } = await this.warmupService.getDevices();

    // Loop over the owned locations
    for (const location of user.owned) {
      const { id: locationId } = location;

      // loop over the discovered devices and register each one if it has not already been registered
      for (const device of location.rooms) {
        // generate a unique id for the accessory this should be generated from
        // something globally unique, but constant, for example, the device serial
        // number or MAC address
        const uuid = this.api.hap.uuid.generate(device.deviceSN);

        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);

        if (existingAccessory) {
          // the accessory already exists
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          new WarmupPlatformAccessory(this, existingAccessory);
        } else {
          // the accessory does not yet exist, so we need to create it
          this.log.info('Adding new accessory:', device.roomName);

          // create a new accessory
          const accessory = new this.api.platformAccessory(device.roomName, uuid, this.Categories.THERMOSTAT);

          // store a copy of the device object in the `accessory.context`
          // the `context` property can be used to store any data about the accessory you may need
          accessory.context = { locationId };
          accessory.context.device = device;

          // create the accessory handler for the newly create accessory
          // this is imported from `platformAccessory.ts`
          new WarmupPlatformAccessory(this, accessory);

          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
      }
    }

    // Unregister any accessories that we no longer have
    for (let i = 0; i < this.accessories.length; i++) {
      const existingAccessory = this.accessories[i];
      user.owned.forEach((location) => {
        if (!location.rooms.find((device) => device.deviceSN === existingAccessory.context.device.deviceSN)) {
          // the accessory no longer exists
          this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);

          // remove platform accessories that are no longer present
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        }
      });
    }
  };
}
