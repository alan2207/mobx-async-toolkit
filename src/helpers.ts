import { QueryKey } from './types';

export const stringifyKey = ({ baseKey, options = {} }: QueryKey) => {
  return JSON.stringify([baseKey, JSON.stringify(options)]);
};

export const parseKey = (key: string) => {
  const [baseKey, options] = JSON.parse(key);

  return { baseKey, options };
};
