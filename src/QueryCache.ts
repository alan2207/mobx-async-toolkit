import { makeAutoObservable } from 'mobx';

type QueryCacheEntry = {
  root?: string;
  children: Record<string, string>;
};

type QueryKey<O = any> = {
  baseKey: string;
  options?: O;
};

export class QueryCache {
  entries: Record<string, QueryCacheEntry> = {};
  queries: any;

  constructor(queries: any) {
    makeAutoObservable(this);
    this.queries = queries;
  }

  setQueryData<Data>(key: QueryKey, data: Data) {
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
  }

  getQueryData<Data>(key: QueryKey): Data | undefined {
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

    if (!base) return;

    if (base && !options) {
      this.entries[baseKey] = {
        root: '',
        children: {},
      };

      await Promise.all(
        Object.keys(base.children)
          .map((k) => {
            console.log({ baseKey, k });
            return this.queries[baseKey].fetch(JSON.parse(k));
          })
          .concat([this.queries[baseKey].fetch()])
      );
    } else {
      delete this.entries[baseKey].children[JSON.stringify(options)];
      await this.queries[baseKey].fetch(options);
    }
  }

  clear() {
    this.entries = {};
  }
}
