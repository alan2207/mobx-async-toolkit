export enum Status {
  IDLE = 'Idle',
  LOADING = 'Loading',
  ERROR = 'Error',
  SUCCESS = 'Success',
}

export interface QueryOptions<Data, Options = any> {
  fn: (options: Options) => Promise<Data>;
  onSuccess?: (data: Data, options: Options) => void;
  onError?: (error: any, options: Options) => void;
}

export interface MutationOptions<Data, Options = any> {
  fn: (options: Options) => Promise<Data>;
  onSuccess?: (data: Data, options: Options) => void;
  onError?: (error: any, options: Options) => void;
}
