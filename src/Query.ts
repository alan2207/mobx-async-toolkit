import { makeAutoObservable } from 'mobx';
import type { QueryCache } from './QueryCache';
import { Status } from './types';

export type QueryOptions<Data, Options = any> = {
  fn: (options: Options) => Promise<Data>;
  baseKey: string;
};

export class Query<Data = any, Options = any> {
  status: Status = Status.IDLE;
  error: string | null = null;
  data: Data | null = null;
  fn: (options?: Options) => Promise<Data>;
  baseKey: string;
  queryCache: QueryCache;

  constructor({
    fn,
    baseKey,
    queryCache,
  }: QueryOptions<Data> & { queryCache: QueryCache }) {
    makeAutoObservable(this);
    this.fn = fn;
    this.baseKey = baseKey;
    this.queryCache = queryCache;
  }

  setStatus(status: Status) {
    this.status = status;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setData(data: Data | null) {
    this.data = data;
  }

  isIdle() {
    return this.status === Status.IDLE;
  }

  isSuccess() {
    return this.status === Status.SUCCESS;
  }

  isError() {
    return this.status === Status.ERROR;
  }

  isLoading() {
    return this.status === Status.LOADING;
  }

  async refetch(options?: Options) {
    const key = {
      baseKey: this.baseKey,
      options,
    };
    // this.setData(null);
    await this.queryCache.invalidateQuery(key);
  }

  async fetch(options?: Options) {
    const key = options
      ? { baseKey: this.baseKey, options }
      : { baseKey: this.baseKey };
    try {
      this.setError(null);
      // this.setData(null);
      this.setStatus(Status.LOADING);
      const cachedData = this.queryCache.getQueryData<Data>(key);
      console.log({ cachedData });
      if (cachedData) {
        this.setData(cachedData);
        this.setStatus(Status.SUCCESS);
        return cachedData;
      } else {
        const result = await this.fn(options);
        this.setData(result);
        this.queryCache.setQueryData<Data>(key, result);
        this.setStatus(Status.SUCCESS);
        return result;
      }
    } catch (error) {
      console.error(error);
      this.setError(JSON.stringify(error));
      this.setStatus(Status.ERROR);
    }
  }
}
