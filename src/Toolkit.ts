import { makeAutoObservable } from 'mobx';
import { Mutation, MutationOptions } from './Mutation';
import { Query, QueryOptions } from './Query';
import { QueryCache } from './QueryCache';

export * from './types';

export class Toolkit {
  queries: Record<string, Query> = {};
  queryCache: QueryCache;

  constructor() {
    makeAutoObservable(this);
    this.queryCache = new QueryCache(this.queries);
  }

  registerQuery(query: Query) {
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
}

export const createToolkit = () => {
  return new Toolkit();
};
