'use strict';

import assert from 'assert';

import { getToken, makeGQLQuery } from 'warmup-api';

import {
  getUserProfileQuery,
  getDevicesQuery,
  getDeviceQuery,
  deviceOverrideMutation,
  deviceOverrideCancelMutation,
  deviceScheduleMutation,
  deviceOffMutation,
} from './graphql/index.js';

/**
 * Communicates with the Warmup API
 */
export class WarmupService {
  token;

  /**
   *
   * @param {any} log
   * @param {string} [token]
   */
  constructor(log, token) {
    this.log = log;
    this.token = token ?? undefined;
  }

  /**
   * Logs into the service
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    this.token = await getToken(email, password);
  }

  /**
   * Logs out of the service
   */
  logout() {
    this.token = null;
  }

  /**
   * Whether or not the service is logged in
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.token != null;
  }

  /**
   * @typedef UserProfile
   * @prop {object} user
   * @prop {string} user.id
   * @prop {object} user.userProfile
   * @prop {string} user.userProfile.email
   * @prop {string} user.userProfile.firstName
   * @prop {string} user.userProfile.lastName
   */

  /**
   * Logged in user info
   * @returns {Promise<UserProfile>}
   */
  async getUserProfile() {
    assert(this.token, 'Login before getting logged in user profile');
    const query = {
      operationName: 'getUserProfile',
      query: getUserProfileQuery,
      variables: null,
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery(query, this.token);
  }

  /**
   * Gets a list of devices belonging to the user
   * @returns {Promise<any>}
   */
  async getDevices() {
    assert(this.token, 'Login before getting devices');
    const query = {
      operationName: 'getDevices',
      query: getDevicesQuery,
      variables: null,
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery(query, this.token);
  }

  /**
   * Gets the device belonging to the user
   * @param {number} locationId The room id of the device
   * @param {number} roomId The room id of the device
   * @returns {Promise<any>}
   */
  async getDevice(locationId, roomId) {
    assert(this.token, 'Login before getting a device');
    const query = {
      operationName: 'getDevice',
      query: getDeviceQuery,
      variables: { locationId, roomId },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery(query, this.token);
  }

  /**
   *
   * @param {{locationId: number, roomId: [number], temperature: number, minutes: number}} params
   * @returns {Promise<any>}
   */
  async deviceOverride({ locationId, roomId, temperature, minutes }) {
    assert(this.token, 'Login before overriding a device');
    const query = {
      operationName: 'deviceOverride',
      query: deviceOverrideMutation,
      variables: { locationId, roomId, temperature, minutes },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery(query, this.token);
  }

  /**
   *
   * @param {{locationId: number, roomId: [number] }} params
   * @returns {Promise<any>}
   */
  async deviceOverrideCancel({ locationId, roomId }) {
    assert(this.token, 'Login before cancelling an override for a device');
    const query = {
      operationName: 'deviceOverrideCancel',
      query: deviceOverrideCancelMutation,
      variables: { locationId, roomId },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery(query, this.token);
  }

  /**
   *
   * @param {{locationId: number, roomId: [number] }} params
   * @returns {Promise<any>}
   */
  async deviceSchedule({ locationId, roomId }) {
    assert(this.token, 'Login before scheduling a device');
    const query = {
      operationName: 'deviceSchedule',
      query: deviceScheduleMutation,
      variables: { locationId, roomId },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery(query, this.token);
  }

  /**
   *
   * @param {{locationId: number, roomId: [number] }} params
   * @returns {Promise<any>}
   */
  async deviceOff({ locationId, roomId }) {
    assert(this.token, 'Login before turning off a device');
    const query = {
      operationName: 'deviceOff',
      query: deviceOffMutation,
      variables: { locationId, roomId },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery(query, this.token);
  }
}
