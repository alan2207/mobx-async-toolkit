import type { Query } from './Query';

export enum Status {
  IDLE = 'Idle',
  LOADING = 'Loading',
  ERROR = 'Error',
  SUCCESS = 'Success',
}

export type QueryOptions<Data, Options = any> = {
  baseKey: string;
  fn: (options: Options) => Promise<Data>;
  fnOptions: Options;
  onSuccess?: (data: Data, options: Options) => void;
  onError?: (error: any, options: Options) => void;
  cacheTime?: number;
  keepPreviousData?: boolean;
};

export type MutationOptions<Data, Options = any> = {
  fn: (options: Options) => Promise<Data>;
  onSuccess?: (data: Data, options: Options) => void;
  onError?: (error: any, options: Options) => void;
};

export type QueryCacheOptions = {
  queries: Record<string, Query>;
  cacheTime: number;
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
  cacheTime?: number;
  onSuccess?: (data: any, options: any) => void;
  onError?: (error: any, options: any) => void;
  keepPreviousData?: boolean;
};
