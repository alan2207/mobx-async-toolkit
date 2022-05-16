import { makeAutoObservable } from 'mobx';
import { Status, QueryOptions } from './types';

export class Query<Data = any, Options = any, Error = any> {
  status: Status = Status.IDLE;
  error: Error | null = null;
  data: Data | null = null;
  private fn: (options?: Options) => Promise<Data>;
  private onSuccess: (data: Data, options?: Options) => void;
  private onError: (error: Error, options?: Options) => void;
  private options?: Options;
  private refetchInterval: NodeJS.Timer | null = null;

  constructor({ fn, onSuccess, onError }: QueryOptions<Data>) {
    makeAutoObservable(this);
    this.fn = fn;
    this.options = undefined;
    this.onSuccess = onSuccess || (() => {});
    this.onError = onError || (() => {});
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

  private setOptions(options?: Options) {
    this.options = options;
  }

  get isIdle() {
    return this.status === Status.IDLE;
  }

  get isSuccess() {
    return this.status === Status.SUCCESS;
  }

  get isError() {
    return this.status === Status.ERROR;
  }

  get isLoading() {
    return this.status === Status.LOADING;
  }

  refetch() {
    return this.fetch(this.options);
  }

  async startPolling(interval: number, options?: Options) {
    await this.fetch(options);

    if (interval > 0) {
      if (this.refetchInterval) {
        clearInterval(this.refetchInterval);
      }

      this.refetchInterval = setInterval(() => {
        this.fetch(options);
      }, interval);
    } else {
      throw new Error('Interval must be greater than 0!');
    }
  }

  stopPolling() {
    if (this.refetchInterval) {
      clearInterval(this.refetchInterval);
    }

    this.refetchInterval = null;
  }

  async fetch(options?: Options) {
    if (this.status === Status.LOADING) return undefined;
    try {
      this.setError(null);
      this.setStatus(Status.LOADING);
      this.setOptions(options);
      const result = await this.fn(options);
      this.setData(result);
      this.setStatus(Status.SUCCESS);
      this.onSuccess(result, options);
      return result;
    } catch (error: any) {
      this.setError(error);
      this.setStatus(Status.ERROR);
      this.onError(error, options);
      return undefined;
    }
  }
}
