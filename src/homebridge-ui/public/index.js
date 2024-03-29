console.debug('CommonJS environment');

/**
 *
 * @param {window.Document} document
 * @param {HomebridgePluginUi} homebridge
 */
const configUI = async (document, homebridge) => {
  console.debug('configUI-JS');

  // get the initial config - this is an array potentially containing multiple config blocks
  const pluginConfig = await homebridge.getPluginConfig();

  initialiseForm(pluginConfig);

  // watch for click events on the loginButton
  document
    .querySelector('#loginButton')
    .addEventListener('click', () => handleLoginClick(document, homebridge, pluginConfig));

  // watch for click events on the logoutButton
  document
    .querySelector('#logoutButton')
    .addEventListener('click', () => handleLogoutClick(document, homebridge, pluginConfig));
};

const initialiseForm = (pluginConfig) => {
  console.debug('initialiseForm', pluginConfig, pluginConfig.length && pluginConfig[0].token);
  // determine which form to show, either login or logout
  if (pluginConfig.length && pluginConfig[0].token) {
    console.debug('initialiseForm', 'Found token:', pluginConfig[0].token);
    document.querySelector('#token').value = pluginConfig[0].token;

    if (document.getElementById('logoutForm').classList.contains('d-none')) {
      document.getElementById('logoutForm').classList.remove('d-none');
    }
    if (!document.getElementById('loginForm').classList.contains('d-none')) {
      document.getElementById('loginForm').classList.add('d-none');
    }
  } else {
    console.debug('initialiseForm', 'No token found');
    pluginConfig.push({});

    if (document.getElementById('loginForm').classList.contains('d-none')) {
      document.getElementById('loginForm').classList.remove('d-none');
    }
  }
  console.debug('initialiseForm', 'Finished');
};

const handleLoginClick = async (document, homebridge, pluginConfig) => {
  // validate a username was provided
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;

  if (!email) {
    // create a error / red toast notification if the required input is not provided.
    homebridge.toast.error('Email must be provided.', 'Error');
    return;
  }

  if (!password) {
    // create a error / red toast notification if the required input is not provided.
    homebridge.toast.error('Password must be provided.', 'Error');
    return;
  }

  // starting the request, show the loading spinner
  homebridge.showSpinner();

  // request a token from the server
  try {
    const response = await homebridge.request('/token', {
      email,
      password,
    });

    // update the token input with the response
    document.querySelector('#token').value = response.token;

    // update the plugin config
    pluginConfig[0].token = response.token;
    homebridge.updatePluginConfig(pluginConfig);

    if (document.getElementById('logoutForm').classList.contains('d-none')) {
      document.getElementById('logoutForm').classList.remove('d-none');
    }
    if (!document.getElementById('loginForm').classList.contains('d-none')) {
      document.getElementById('loginForm').classList.add('d-none');
    }

    // show a success toast notification
    homebridge.toast.success('Logged in', 'Success');
  } catch (e) {
    homebridge.toast.error(e.error, e.message);
  } finally {
    // remember to hide the spinner
    homebridge.hideSpinner();
  }
};

const handleLogoutClick = async (document, homebridge, pluginConfig) => {
  // starting the request, show the loading spinner
  homebridge.showSpinner();

  // request a token from the server
  try {
    // update the token input with null
    document.querySelector('#token').value = null;

    // update the plugin config with null
    pluginConfig[0].token = null;
    homebridge.updatePluginConfig(pluginConfig);

    if (document.getElementById('loginForm').classList.contains('d-none')) {
      document.getElementById('loginForm').classList.remove('d-none');
    }
    if (!document.getElementById('logoutForm').classList.contains('d-none')) {
      document.getElementById('logoutForm').classList.add('d-none');
    }

    // show a success toast notification
    homebridge.toast.success('Logged out', 'Success');
  } catch (e) {
    homebridge.toast.error(e.error, e.message);
  } finally {
    // remember to hide the spinner
    homebridge.hideSpinner();
  }
};

// Check for CommonJS environment (like Node.js)
if (typeof module !== 'undefined' && module.exports) {
  console.debug('CommonJS environment');

  // CommonJS environment
  // Export functions using module.exports
  module.exports = {
    configUI,
    initialiseForm,
    handleLoginClick,
    handleLogoutClick,
  };
} else if (typeof window !== 'undefined' && window.document) {
  // Browser environment

  // Ensure we have homebridge too
  if (typeof window.homebridge !== 'undefined') {
    await configUI(window.document, window.homebridge);
  }
} else {
  // Fallback for unknown environments
  console.error('Unsupported environment: No support for commonjs or window');
}
