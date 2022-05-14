import { makeAutoObservable } from 'mobx';
import { stringifyKey } from './helpers';
import type { Query } from './Query';
import { QueryCacheEntry, QueryCacheOptions, QueryKey } from './types';

export class QueryCache {
  private entries: Record<string, QueryCacheEntry> = {};
  private queries: Map<QueryKey, Query>;
  private cacheTime: number;
  private cacheClearenceSchedule: Record<string, NodeJS.Timeout> = {};

  constructor({ queries, cacheTime }: QueryCacheOptions) {
    makeAutoObservable(this);
    this.queries = queries;
    this.cacheTime = cacheTime;
  }

  setQueryData<Data>(
    key: QueryKey,
    data: Data,
    queryOptions: { cacheTime: number | undefined }
  ) {
    if (this.cacheTime <= 0) return;

    const { baseKey, options } = key;
    const stringifiedKey = stringifyKey(key);

    const base: QueryCacheEntry = this.entries[baseKey] || {
      children: {},
    };

    if (options) {
      base.children[stringifiedKey] = JSON.stringify(data);
    } else {
      base.root = JSON.stringify(data);
    }

    this.entries[baseKey] = { ...base };

    if (this.cacheClearenceSchedule[stringifiedKey]) {
      clearTimeout(this.cacheClearenceSchedule[stringifiedKey]);
      delete this.cacheClearenceSchedule[stringifiedKey];
    }

    this.cacheClearenceSchedule[stringifiedKey] = setTimeout(async () => {
      delete this.entries[baseKey];
    }, queryOptions.cacheTime ?? this.cacheTime);

    return undefined;
  }

  getQueryData<Data>(key: QueryKey): Data | undefined {
    const { baseKey, options } = key;
    const stringifiedKey = stringifyKey(key);

    const base = this.entries[baseKey];

    if (!base) {
      return undefined;
    }

    if (options && !base.children[stringifiedKey]) {
      return undefined;
    }

    if (!options) {
      if (!base.root) {
        return undefined;
      }
      return JSON.parse(base.root);
    } else {
      return JSON.parse(base.children[stringifiedKey]);
    }
  }

  async refetchQuery(key: QueryKey) {
    const { baseKey, options } = key;

    if (!options) {
      await Promise.all(
        Array.from(this.queries.values()).reduce<Promise<any>[]>((acc, v) => {
          if (baseKey === v.baseKey) {
            acc.push(v.fetch());
          }

          return acc;
        }, [])
      );
    } else {
      if (this.queries.get(key)) {
        await this.queries.get(key)?.fetch();
      }
    }
  }

  async invalidateQuery(key: QueryKey) {
    const { baseKey, options } = key;
    const stringifiedKey = stringifyKey(key);
    const base = this.entries[baseKey];

    if (!base) {
      await this.refetchQuery(key);
      return;
    }

    if (base && !options) {
      delete this.entries[baseKey];
    } else {
      delete this.entries[baseKey].children[stringifiedKey];
    }

    await this.refetchQuery(key);
  }

  getEntries() {
    return this.entries;
  }

  clear() {
    this.entries = {};
  }
}
