import { makeAutoObservable } from 'mobx';
import { Mutation, Query, Toolkit } from '../src/index';

export enum TodoStatus {
  PENDING = 'Pending',
  DONE = 'Done',
  ALL = 'All',
}

interface Todo {
  id: string;
  title: string;
  description: string;
  status: TodoStatus | undefined;
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

export type TodosModelOptions = {
  todo: GetTodoOptions;
  todos: GetTodosOptions;
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
    loggerService: LoggerService,
    options: TodosModelOptions
  ) {
    makeAutoObservable(this);
    this.toolkit = toolkit;
    this.apiService = apiService;
    this.loggerService = loggerService;

    this.todoQuery = toolkit.createQuery<Todo, GetTodoOptions>({
      fn: apiService.getTodo,
      fnOptions: options.todo,
      baseKey: 'todo',
      onSuccess: loggerService.success,
      onError: loggerService.error,
    });

    this.todosQuery = toolkit.createQuery<Todo[], GetTodosOptions>({
      fn: apiService.getTodos,
      fnOptions: options.todos,
      baseKey: 'todos',
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
