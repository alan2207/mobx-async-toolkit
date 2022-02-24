import { makeAutoObservable } from 'mobx';
import type { QueryCache } from './QueryCache';
import { Status, QueryOptions } from './types';

export class Query<Data = any, Options = any, Error = any> {
  status: Status = Status.IDLE;
  error: Error | null = null;
  data: Data | null;
  fnOptions: Options;
  private fn: (options: Options) => Promise<Data>;
  readonly baseKey: string;
  private queryCache: QueryCache;
  private cacheTime: number | undefined;
  private onSuccess: (data: Data, options: Options) => void;
  private onError: (error: Error, options: Options) => void;
  private keepPreviousData: boolean;

  private refetchIntervalRef: NodeJS.Timer | null = null;

  constructor({
    fn,
    fnOptions,
    onSuccess,
    onError,
    baseKey,
    queryCache,
    cacheTime,
    keepPreviousData,
    initialData,
  }: QueryOptions<Data, Options> & {
    queryCache: QueryCache;
  }) {
    makeAutoObservable(this);
    this.fn = fn;
    this.fnOptions = fnOptions;
    this.onSuccess = onSuccess || (() => {});
    this.onError = onError || (() => {});
    this.baseKey = baseKey;
    this.queryCache = queryCache;
    this.cacheTime = cacheTime;
    this.keepPreviousData = keepPreviousData ?? false;
    this.data = initialData || null;
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

  async startQuery(config?: {
    refetchInterval?: number;
    optionsOverride?: Partial<Options>;
  }) {
    const optionsOverride = config?.optionsOverride;
    const refetchInterval = config?.refetchInterval;

    await this.fetch(optionsOverride);
    if (refetchInterval && refetchInterval > 0) {
      if (this.refetchIntervalRef) {
        clearInterval(this.refetchIntervalRef);
      }

      this.refetchIntervalRef = setInterval(() => {
        this.fetch(optionsOverride);
      }, refetchInterval);
    }
  }

  async stopQuery() {
    if (this.refetchIntervalRef) {
      clearInterval(this.refetchIntervalRef);
    }

    this.refetchIntervalRef = null;
  }

  async fetch(optionsOverride?: Partial<Options>) {
    if (this.status === Status.LOADING) return undefined;

    const options = { ...this.fnOptions, ...optionsOverride };

    const key = {
      baseKey: this.baseKey,
      options: this.fnOptions,
    };

    try {
      if (!this.keepPreviousData) {
        this.setError(null);
      }
      this.setStatus(Status.LOADING);
      const cachedData = this.queryCache.getQueryData<Data>(key);

      if (cachedData) {
        this.setData(cachedData);
        this.setStatus(Status.SUCCESS);
        return cachedData;
      } else {
        const result = await this.fn(options);
        this.setData(result);
        this.queryCache.setQueryData<Data>(key, result, {
          cacheTime: this.cacheTime,
        });
        this.setStatus(Status.SUCCESS);
        this.onSuccess(result, options!);
        return result;
      }
    } catch (error: any) {
      this.setError(error);
      this.setStatus(Status.ERROR);
      this.onError(error, options!);
      return undefined;
    }
  }

  reset() {
    this.data = null;
    this.error = null;
    this.status = Status.IDLE;
  }
}
