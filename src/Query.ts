import { makeAutoObservable } from 'mobx';
import type { QueryCache } from './QueryCache';
import { Status, QueryOptions } from './types';

export class Query<Data = any, Options = any, Error = any> {
  status: Status = Status.IDLE;
  error: Error | null = null;
  data: Data | null = null;
  private fn: (options?: Options) => Promise<Data>;
  readonly baseKey: string;
  private queryCache: QueryCache;

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

  private setStatus(status: Status) {
    this.status = status;
  }

  private setError(error: Error | null) {
    this.error = error;
  }

  private setData(data: Data | null) {
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
    await this.queryCache.invalidateQuery(key);
  }

  async fetch(options?: Options) {
    const key = options
      ? { baseKey: this.baseKey, options }
      : { baseKey: this.baseKey };
    try {
      this.setError(null);
      this.setStatus(Status.LOADING);
      const cachedData = this.queryCache.getQueryData<Data>(key);
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
    } catch (error: any) {
      console.error(error);
      this.setError(error);
      this.setStatus(Status.ERROR);
      return undefined;
    }
  }
}
