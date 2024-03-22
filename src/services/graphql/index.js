import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 */
const gqlQueries = () => {
  // Query based on https://learning.atheros.ai/blog/graphql-introspection-and-introspection-queries
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
    getDevicesQuery,
    getDeviceQuery,
    deviceOffMutation,
    deviceOverrideMutation,
    deviceOverrideCancelMutation,
    deviceScheduleMutation,
  };
};

const queries = gqlQueries();

export const getDevicesQuery = queries.getDevicesQuery;
export const getDeviceQuery = queries.getDeviceQuery;
export const deviceOffMutation = queries.deviceOffMutation;
export const deviceOverrideMutation = queries.deviceOverrideMutation;
export const deviceOverrideCancelMutation = queries.deviceOverrideCancelMutation;
export const deviceScheduleMutation = queries.deviceScheduleMutation;
