import { makeAutoObservable } from 'mobx';
import { Status, MutationOptions } from './types';

export class Mutation<Data = any, Options = any, Error = any> {
  status: Status = Status.IDLE;
  error: string | null = null;
  private fn: (options?: Options) => Promise<Data>;
  private onSuccess: (data: Data, options?: Options) => void;
  private onError: (error: Error, options?: Options) => void;

  constructor({ fn, onSuccess, onError }: MutationOptions<Data>) {
    makeAutoObservable(this);
    this.fn = fn;
    this.onSuccess = onSuccess || (() => {});
    this.onError = onError || (() => {});
  }

  private setStatus(status: Status) {
    this.status = status;
  }

  private setError(error: string | null) {
    this.error = error;
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

  async mutate(options?: Options) {
    try {
      this.setError(null);
      this.setStatus(Status.LOADING);
      const result = await this.fn(options);
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
