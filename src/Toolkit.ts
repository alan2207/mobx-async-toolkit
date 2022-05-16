import { makeAutoObservable } from 'mobx';
import { Mutation } from './Mutation';
import { Query } from './Query';

import { MutationOptions, QueryOptions } from './types';

export class Toolkit {
  private queries = new Map<string, Query>();

  constructor() {
    makeAutoObservable(this);
  }

  createQuery<Data = any, Options = any>(
    options: QueryOptions<Data, Options> & { key?: string }
  ) {
    if (options.key) {
      const cachedQuery = this.queries.get(options.key);

      if (cachedQuery) {
        return cachedQuery as Query<Data, Options>;
      }
    }

    const newQuery = new Query<Data, Options>({
      ...options,
    });

    if (options.key) {
      this.queries.set(options.key, newQuery);
    }

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
