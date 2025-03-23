import { HomebridgePluginUiServer, RequestError } from '@homebridge/plugin-ui-utils';
import { InvalidCredentialsError, AuthorisationError } from 'warmup-api';
import { type Logger } from 'homebridge';

import { WarmupService } from '../services/index.js';
import { TGetUserProfileResponse } from '../services/warmup-service.js';

class WarmupPluginUiServer extends HomebridgePluginUiServer {
  warmupService: WarmupService;

  constructor() {
    // super() MUST be called first
    super();

    // Handle request for the /token route
    this.onRequest('/token', this.generateToken.bind(this));

    // Handle request for the /user-profile route
    this.onRequest('/user-profile', this.getUserProfile.bind(this));

    this.warmupService = new WarmupService(console as unknown as Logger);

    // This MUST be called when you are ready to accept requests
    this.ready();
  }

  async generateToken({ email, password }: { email: string, password: string }): Promise<{token: string | undefined}> {
    try {
      // Get the token and return it to the ui
      await this.warmupService.login(email, password);
      return {
        token: this.warmupService.token,
      };
    } catch (e) {
      console.error(e);
      if (e instanceof InvalidCredentialsError) {
        throw new RequestError('Invalid email/password combination', this.getErrorMessage(e));
      }
      throw new RequestError('Failed to get token', this.getErrorMessage(e));
    }
  }

  async getUserProfile({ token }: { token: string }): Promise<TGetUserProfileResponse> {
    try {
      // Get the token and return it to the ui
      this.warmupService.token = token;
      return await this.warmupService.getUserProfile();
    } catch (e) {
      console.error(e);
      if (e instanceof AuthorisationError) {
        throw new RequestError('Token may have expired. Try logging in again', this.getErrorMessage(e));
      }
      throw new RequestError('Failed to get token', this.getErrorMessage(e));
    }
  }

  getErrorMessage(error: Error | unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

export { WarmupPluginUiServer };

export default WarmupPluginUiServer;
