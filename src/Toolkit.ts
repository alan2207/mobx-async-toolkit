import { makeAutoObservable } from 'mobx';
import { QueryKey } from '.';
import { stringifyKey } from './helpers';
import { Mutation } from './Mutation';
import { Query } from './Query';
import { QueryCache } from './QueryCache';

import { ToolkitOptions, MutationOptions, QueryOptions } from './types';

export class Toolkit {
  private queries: Record<string, Query> = {};
  queryCache: QueryCache;
  private onSuccess: ((data: any, options: any) => void) | undefined;
  private onError: ((error: any, options: any) => void) | undefined;
  private keepPreviousData: boolean;

  constructor({
    cacheTime,
    onSuccess,
    onError,
    keepPreviousData,
  }: ToolkitOptions = {}) {
    makeAutoObservable(this);
    this.queryCache = new QueryCache({
      queries: this.queries,
      cacheTime: cacheTime ?? 1000 * 60, // default cache time is 1 minute;
    });
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.keepPreviousData = keepPreviousData ?? false;
  }

  private registerQuery(key: string, query: Query) {
    if (!this.queries[key]) {
      this.queries[key] = query;
    }
  }

  createQuery<Data = any, Options = any>(options: QueryOptions<Data, Options>) {
    const key = stringifyKey({
      baseKey: options.baseKey,
      options: options.fnOptions,
    });

    const cachedQuery = this.queries[key];

    if (cachedQuery) {
      return cachedQuery as Query<Data, Options>;
    }

    const defaults = {
      onSuccess: this.onSuccess,
      onError: this.onError,
      keepPreviousData: this.keepPreviousData,
    };

    const newQuery = new Query<Data, Options>({
      ...defaults,
      ...options,
      queryCache: this.queryCache,
    });
    this.registerQuery(key, newQuery);

    return newQuery;
  }

  createMutation<Data = any, Options = any>(
    options: MutationOptions<Data, Options>
  ) {
    const defaults = {
      onSuccess: this.onSuccess,
      onError: this.onError,
    };
    return new Mutation<Data, Options>({ ...defaults, ...options });
  }

  removeQuery(key: QueryKey) {
    const stringifiedKey = stringifyKey(key);
    delete this.queries[stringifiedKey];
  }

  reset() {
    this.queries = {};
    this.queryCache.clear();
  }
}

export const createToolkit = (options?: ToolkitOptions) => {
  return new Toolkit(options);
};
