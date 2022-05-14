import { makeAutoObservable } from 'mobx';
import { QueryKey } from '.';
import { Mutation } from './Mutation';
import { Query } from './Query';
import { QueryCache } from './QueryCache';

import { ToolkitOptions, MutationOptions, QueryOptions } from './types';

export class Toolkit {
  private queries = new Map<QueryKey, Query>();
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

  private registerQuery(key: QueryKey, query: Query) {
    if (!this.queries.has(key)) {
      this.queries.set(key, query);
    }
  }

  createQuery<Data = any, Options = any>(options: QueryOptions<Data, Options>) {
    const key = {
      baseKey: options.baseKey,
      options: options.fnOptions,
    };

    const cachedQuery = this.queries.get(key);

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
  createSimpleQuery<Data = any, Options = any>(
    options: QueryOptions<Data, Options>
  ) {
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
    this.queries.delete(key);
  }

  reset() {
    this.queries = new Map();
    this.queryCache.clear();
  }
}

export const createToolkit = (options?: ToolkitOptions) => {
  return new Toolkit(options);
};
