import { makeAutoObservable } from 'mobx';
import type { Query } from './Query';
import { QueryCacheEntry, QueryCacheOptions, QueryKey } from './types';

export class QueryCache {
  private entries: Record<string, QueryCacheEntry> = {};
  private queries: Record<string, Query>;
  private isCacheEnabled: boolean;

  constructor({ queries, isCacheEnabled }: QueryCacheOptions) {
    makeAutoObservable(this);
    this.queries = queries;
    this.isCacheEnabled = isCacheEnabled ?? true;
  }

  setQueryData<Data>(key: QueryKey, data: Data) {
    if (!this.isCacheEnabled) {
      return undefined;
    }

    const { baseKey, options } = key;

    const base: QueryCacheEntry = this.entries[baseKey] || {
      children: {},
    };

    if (options) {
      base.children[JSON.stringify(options)] = JSON.stringify(data);
    } else {
      base.root = JSON.stringify(data);
    }

    this.entries[baseKey] = { ...base };

    return undefined;
  }

  getQueryData<Data>(key: QueryKey): Data | undefined {
    if (!this.isCacheEnabled) {
      return undefined;
    }

    const { baseKey, options } = key;

    const base = this.entries[baseKey];

    if (!base) {
      return undefined;
    }

    if (options && !base.children[JSON.stringify(options)]) {
      return undefined;
    }

    if (!options) {
      if (!base.root) {
        return undefined;
      }
      return JSON.parse(base.root);
    } else {
      return JSON.parse(base.children[JSON.stringify(options)]);
    }
  }

  async invalidateQuery(key: QueryKey) {
    const { baseKey, options } = key;
    const base = this.entries[baseKey];

    if (!base && this.isCacheEnabled) return;

    if (base && !options) {
      if (this.isCacheEnabled) {
        delete this.entries[baseKey];
      }

      await Promise.all(
        Object.keys(base.children)
          .map((k) => {
            return this.queries[baseKey].fetch(JSON.parse(k));
          })
          .concat(this.queries[baseKey] && [this.queries[baseKey].fetch()])
      );
    } else {
      if (this.isCacheEnabled) {
        delete this.entries[baseKey].children[JSON.stringify(options)];
      }
      await this.queries[baseKey].fetch(options);
    }
  }

  getEntries() {
    return this.entries;
  }

  clear() {
    this.entries = {};
  }
}
