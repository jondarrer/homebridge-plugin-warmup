'use strict';

import assert from 'assert';

import type { Logger } from 'homebridge';
import { getToken, makeGQLQuery } from 'warmup-api';
import type { HeatingMutation, HeatingQuery } from 'warmup-api/dist/src/types.js';
import type { IMakeRequestGQLResponse } from 'warmup-api/dist/src/make-request.js';

import {
  getUserProfileQuery,
  getDevicesQuery,
  getDeviceQuery,
  deviceOverrideMutation,
  deviceOverrideCancelMutation,
  deviceScheduleMutation,
  deviceOffMutation,
} from './graphql/index.js';

export interface IDeviceOverrideParams { locationId: number, roomId: [number], temperature: number, minutes: number };
export type TGetUserProfileResponse = IMakeRequestGQLResponse<Pick<HeatingQuery, 'user'>>;
export type TGetDevicesResponse = IMakeRequestGQLResponse<Pick<HeatingQuery, 'user'>>;
export type TGetDeviceResponse = IMakeRequestGQLResponse<Pick<HeatingQuery, 'user'>>;

/**
 * Communicates with the Warmup API
 */
export class WarmupService {
  constructor(private log: Logger, public token?: string | undefined) {}

  /**
   * Logs into the service
   */
  async login(email: string, password: string) {
    this.token = await getToken(email, password);
  }

  /**
   * Logs out of the service
   */
  logout() {
    this.token = undefined;
  }

  /**
   * Whether or not the service is logged in
   */
  isLoggedIn(): boolean {
    return this.token !== undefined;
  }

//   // Existing type
// type Tenant = {
//   id:string;
//   description:string;
//   name:string;
//   approvedUsers: Array<{
//     id:string;
//     alias:string;
//   }>
// }

// // Pick it apart
// type TenantManagePageQueryTenant = 
// Pick<Tenant, 'id' | 'description' | 'name'> & {
//   approvedUsers: Array<Pick<Tenant['approvedUsers'][0], 'id' | 'alias'>>
// }

  /**
   * Logged in user info
   */
  async getUserProfile(): Promise<TGetUserProfileResponse> {
    assert(this.token, 'Login before getting logged in user profile');
    const query = {
      operationName: 'getUserProfile',
      query: getUserProfileQuery,
      variables: undefined,
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery<HeatingQuery>(query, this.token) as TGetUserProfileResponse;
  }

  /**
   * Gets a list of devices belonging to the user
   */
  async getDevices(): Promise<TGetDevicesResponse> {
    assert(this.token, 'Login before getting devices');
    const query = {
      operationName: 'getDevices',
      query: getDevicesQuery,
      variables: undefined,
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery<HeatingQuery>(query, this.token) as TGetDevicesResponse;
  }

  /**
   * Gets the device belonging to the user
   * @param locationId The room id of the device
   * @param roomId The room id of the device
   */
  async getDevice(locationId: number, roomId: number): Promise<TGetDeviceResponse> {
    assert(this.token, 'Login before getting a device');
    const query = {
      operationName: 'getDevice',
      query: getDeviceQuery,
      variables: { locationId, roomId },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery<HeatingQuery>(query, this.token) as TGetDeviceResponse;
  }

  async deviceOverride({ locationId, roomId, temperature, minutes }: IDeviceOverrideParams): Promise<any> {
    assert(this.token, 'Login before overriding a device');
    const query = {
      operationName: 'deviceOverride',
      query: deviceOverrideMutation,
      variables: { locationId, roomId, temperature, minutes },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery<HeatingMutation>(query, this.token);
  }

  async deviceOverrideCancel({ locationId, roomId }: {locationId: number, roomId: [number] }): Promise<any> {
    assert(this.token, 'Login before cancelling an override for a device');
    const query = {
      operationName: 'deviceOverrideCancel',
      query: deviceOverrideCancelMutation,
      variables: { locationId, roomId },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery<HeatingQuery>(query, this.token);
  }

  async deviceSchedule({ locationId, roomId }: {locationId: number, roomId: [number] }): Promise<any> {
    assert(this.token, 'Login before scheduling a device');
    const query = {
      operationName: 'deviceSchedule',
      query: deviceScheduleMutation,
      variables: { locationId, roomId },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery<HeatingMutation>(query, this.token);
  }

  async deviceOff({ locationId, roomId }: {locationId: number, roomId: [number] }): Promise<any> {
    assert(this.token, 'Login before turning off a device');
    const query = {
      operationName: 'deviceOff',
      query: deviceOffMutation,
      variables: { locationId, roomId },
    };

    this.log.debug(`Querying GQL endpoint with ${JSON.stringify(query)}`);

    return await makeGQLQuery<HeatingMutation>(query, this.token);
  }
}
