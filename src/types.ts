import type { Query } from './Query';

export enum Status {
  IDLE = 'Idle',
  LOADING = 'Loading',
  ERROR = 'Error',
  SUCCESS = 'Success',
}

export type QueryOptions<Data, Options = any> = {
  fn: (options: Options) => Promise<Data>;
  baseKey: string;
};

export type MutationOptions<Data, Options = any> = {
  fn: (options: Options) => Promise<Data>;
};

export type QueryCacheOptions = {
  queries: Record<string, Query>;
  isCacheEnabled?: boolean;
};

export type QueryCacheEntry = {
  root?: string;
  children: Record<string, string>;
};

export type QueryKey<O = any> = {
  baseKey: string;
  options?: O;
};

export type ToolkitOptions = {
  isCacheEnabled?: boolean;
};
