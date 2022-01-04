import type { Query } from './Query';

export enum Status {
  IDLE = 'Idle',
  LOADING = 'Loading',
  ERROR = 'Error',
  SUCCESS = 'Success',
}

export type QueryOptions<Data, Options = any> = {
  fn: (options: Options) => Promise<Data>;
  onSuccess?: (data: Data, options: Options) => void;
  onError?: (error: any, options: Options) => void;
  baseKey: string;
};

export type MutationOptions<Data, Options = any> = {
  fn: (options: Options) => Promise<Data>;
  onSuccess?: (data: Data, options: Options) => void;
  onError?: (error: any, options: Options) => void;
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
