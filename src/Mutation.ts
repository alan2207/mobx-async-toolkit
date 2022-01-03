import { makeAutoObservable } from 'mobx';
import { Status } from './types';

export type MutationOptions<Data, Options = any> = {
  fn: (options: Options) => Promise<Data>;
};

export class Mutation<Data = any, Options = any> {
  status: Status = Status.IDLE;
  error: string | null = null;
  data: Data | null = null;
  fn: (options?: Options) => Promise<Data>;

  constructor({ fn }: MutationOptions<Data>) {
    makeAutoObservable(this);
    this.fn = fn;
  }

  setStatus(status: Status) {
    this.status = status;
  }

  setError(error: string | null) {
    this.error = error;
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

  async mutate(options: Options) {
    try {
      this.setError(null);
      this.setStatus(Status.LOADING);
      const result = await this.fn(options);
      this.setStatus(Status.SUCCESS);
      return result;
    } catch (error) {
      console.error(error);
      this.setError(JSON.stringify(error));
      this.setStatus(Status.ERROR);
      return;
    }
  }
}
