import { CharacteristicMock } from "./characteristic-mock.js";
import { ServiceMock } from "./service-mock.js";

export const HAPStatus = {
  READ_ONLY_CHARACTERISTIC: 'READ_ONLY_CHARACTERISTIC',
  NOT_ALLOWED_IN_CURRENT_STATE: 'NOT_ALLOWED_IN_CURRENT_STATE',
}

export class HapStatusError extends Error {}

export const Categories = {
  THERMOSTAT: 9,
};

export class HAPMock {
  Characteristic = CharacteristicMock;
  Service = ServiceMock;
  Categories = Categories;
  uuid = {
    generate: (uuid: string) => `UUID:${uuid}`,
  };
  HAPStatus = HAPStatus;
  HapStatusError = HapStatusError;
}