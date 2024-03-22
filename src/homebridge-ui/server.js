import { HomebridgePluginUiServer, RequestError } from '@homebridge/plugin-ui-utils';
import { getToken } from 'warmup-api';

class WarmupPluginUiServer extends HomebridgePluginUiServer {
  constructor() {
    // super() MUST be called first
    super();

    // Handle request for the /token route
    this.onRequest('/token', this.generateToken.bind(this));

    // This MUST be called when you are ready to accept requests
    this.ready();
  }

  /**
   *
   * @param {{email: string, password: string}} param
   * @returns {Promise<{token: string}>}
   */
  async generateToken({ email, password }) {
    try {
      // Get the token and return it to the ui
      return {
        token: await getToken(email, password),
      };
    } catch (e) {
      throw new RequestError('Failed to get token', { message: this.getErrorMessage(e) });
    }
  }

  /**
   *
   * @param {unknown} error
   * @returns {string}
   */
  getErrorMessage(error) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

(() => {
  return new WarmupPluginUiServer();
})();
