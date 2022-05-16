import { makeAutoObservable } from 'mobx';
import { Mutation, Query, Toolkit } from '../src/index';

export enum TodoStatus {
  PENDING = 'Pending',
  DONE = 'Done',
}

interface Todo {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
}

type GetTodosOptions = {
  status: TodoStatus;
};

type GetTodoOptions = { id: string };

type CreateTodoOptions = {
  data: Omit<Todo, 'id' | 'status'>;
};

type ApiService = {
  getTodo: (options: GetTodoOptions) => Promise<Todo>;
  getTodos: (options?: GetTodosOptions) => Promise<Todo[]>;
  createTodo: (options: CreateTodoOptions) => Promise<Todo>;
};

type LoggerService = {
  success: (...args: any) => void;
  error: (...args: any) => void;
};

export class TodosModel {
  toolkit: Toolkit;
  apiService: ApiService;
  loggerService: LoggerService;

  todoQuery: Query<Todo, GetTodoOptions>;
  todosQuery: Query<Todo[], GetTodosOptions>;
  createTodoMutation: Mutation<Todo, CreateTodoOptions>;

  constructor(
    toolkit: Toolkit,
    apiService: ApiService,
    loggerService: LoggerService
  ) {
    makeAutoObservable(this);
    this.toolkit = toolkit;
    this.apiService = apiService;
    this.loggerService = loggerService;

    this.todoQuery = toolkit.createQuery<Todo, GetTodoOptions>({
      fn: apiService.getTodo,
      key: 'todo',
      onSuccess: loggerService.success,
      onError: loggerService.error,
    });

    this.todosQuery = toolkit.createQuery<Todo[], GetTodosOptions>({
      fn: apiService.getTodos,
      key: 'todos',
      onSuccess: loggerService.success,
      onError: loggerService.error,
    });

    this.createTodoMutation = toolkit.createMutation<Todo, CreateTodoOptions>({
      fn: apiService.createTodo,
      onSuccess: loggerService.success,
      onError: loggerService.error,
    });
  }
}
