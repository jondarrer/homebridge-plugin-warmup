import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 */
const gqlQueries = () => {
  // Query based on https://learning.atheros.ai/blog/graphql-introspection-and-introspection-queries
  const getUserProfileQuery = readFileSync(join(__dirname, 'get-user-profile-query.graphql'), {
    encoding: 'utf-8',
  });
  const getDevicesQuery = readFileSync(join(__dirname, 'get-devices-query.graphql'), {
    encoding: 'utf-8',
  });
  const getDeviceQuery = readFileSync(join(__dirname, 'get-device-query.graphql'), {
    encoding: 'utf-8',
  });
  const deviceOffMutation = readFileSync(join(__dirname, 'device-off-mutation.graphql'), {
    encoding: 'utf-8',
  });
  const deviceOverrideMutation = readFileSync(join(__dirname, 'device-override-mutation.graphql'), {
    encoding: 'utf-8',
  });
  const deviceOverrideCancelMutation = readFileSync(join(__dirname, 'device-override-cancel-mutation.graphql'), {
    encoding: 'utf-8',
  });
  const deviceScheduleMutation = readFileSync(join(__dirname, 'device-schedule-mutation.graphql'), {
    encoding: 'utf-8',
  });

  return {
    getUserProfileQuery,
    getDevicesQuery,
    getDeviceQuery,
    deviceOffMutation,
    deviceOverrideMutation,
    deviceOverrideCancelMutation,
    deviceScheduleMutation,
  };
};

const queries = gqlQueries();

export const getUserProfileQuery = queries.getUserProfileQuery;
export const getDevicesQuery = queries.getDevicesQuery;
export const getDeviceQuery = queries.getDeviceQuery;
export const deviceOffMutation = queries.deviceOffMutation;
export const deviceOverrideMutation = queries.deviceOverrideMutation;
export const deviceOverrideCancelMutation = queries.deviceOverrideCancelMutation;
export const deviceScheduleMutation = queries.deviceScheduleMutation;
