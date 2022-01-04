import { makeAutoObservable } from 'mobx';
import { Mutation } from './Mutation';
import { Query } from './Query';
import { QueryCache } from './QueryCache';

import { ToolkitOptions, MutationOptions, QueryOptions } from './types';

export class Toolkit {
  private queries: Record<string, Query> = {};
  queryCache: QueryCache;

  constructor({ isCacheEnabled }: ToolkitOptions = {}) {
    makeAutoObservable(this);
    this.queryCache = new QueryCache({
      isCacheEnabled,
      queries: this.queries,
    });
  }

  private registerQuery(query: Query) {
    if (!this.queries[query.baseKey]) {
      this.queries[query.baseKey] = query;
    }
  }

  createQuery<Data = any, Options = any>(options: QueryOptions<Data, Options>) {
    const cachedQuery = this.queries[options.baseKey];

    if (cachedQuery) {
      return cachedQuery as Query<Data, Options>;
    }

    const newQuery = new Query<Data, Options>({
      ...options,
      queryCache: this.queryCache,
    });
    this.registerQuery(newQuery);

    return newQuery;
  }

  createMutation<Data = any, Options = any>(
    options: MutationOptions<Data, Options>
  ) {
    return new Mutation<Data, Options>(options);
  }

  reset() {
    this.queries = {};
    this.queryCache.clear();
  }
}

export const createToolkit = (options?: ToolkitOptions) => {
  return new Toolkit(options);
};
