import { TodosModel, TodoStatus } from './testApi';

import { createToolkit, Status, Toolkit } from '../src/index';

const apiService = {
  getTodo: jest.fn(),
  getTodos: jest.fn(),
  createTodo: jest.fn(),
};

jest.useFakeTimers();
jest.spyOn(global, 'setInterval');
jest.spyOn(global, 'clearInterval');

const todo = {
  title: 'Todo 1',
  description: 'This is important',
  id: '1',
  status: TodoStatus.PENDING,
};

const todos = [todo];

const loggerService = {
  success: jest.fn(),
  error: jest.fn(),
};

let model: TodosModel;
let toolkit: Toolkit;

beforeEach(() => {
  jest.resetAllMocks();
  toolkit = createToolkit();
  model = new TodosModel(toolkit, apiService, loggerService);
});

describe('Test', () => {
  describe('query', () => {
    test('simple', async () => {
      apiService.getTodos.mockImplementation(() => todos);
      expect(model.todosQuery.status).toBe(Status.IDLE);
      const promise = model.todosQuery.fetch();
      expect(model.todosQuery.status).toBe(Status.LOADING);
      await promise;
      expect(model.todosQuery.status).toBe(Status.SUCCESS);
      expect(apiService.getTodos).toHaveBeenCalledTimes(1);
      expect(model.todosQuery.data).toEqual(todos);
    });

    test('with options', async () => {
      const query = { id: '1' };
      apiService.getTodo.mockImplementation(() => todo);
      expect(model.todoQuery.status).toBe(Status.IDLE);
      const promise = model.todoQuery.fetch(query);
      expect(model.todoQuery.status).toBe(Status.LOADING);
      await promise;
      expect(model.todoQuery.status).toBe(Status.SUCCESS);
      expect(model.todoQuery.data).toEqual(todo);
      expect(apiService.getTodo).toHaveBeenCalledTimes(1);
      expect(apiService.getTodo).toHaveBeenCalledWith(query);
    });

    test('that fails', async () => {
      apiService.getTodos.mockImplementation(() => {
        throw new Error();
      });
      expect(model.todosQuery.status).toBe(Status.IDLE);
      const promise = model.todosQuery.fetch();
      expect(model.todosQuery.status).toBe(Status.ERROR);
      await promise;
      expect(model.todosQuery.status).toBe(Status.ERROR);
      expect(apiService.getTodos).toHaveBeenCalledTimes(1);
      expect(model.todosQuery.data).toBeNull();
      expect(model.todosQuery.error).toBeTruthy();
    });

    test('with requests deduping', async () => {
      await Promise.all([1, 2, 3, 4, 5].map(() => model.todosQuery.fetch()));

      expect(apiService.getTodos).toHaveBeenCalledTimes(1);
    });

    test('onSuccess called properly', async () => {
      apiService.getTodos.mockImplementation(() => todos);

      const query = {
        status: TodoStatus.PENDING,
      };

      await model.todosQuery.fetch(query);
      expect(loggerService.success).toHaveBeenCalledWith(todos, query);
    });

    test('onError called properly', async () => {
      const error = new Error();

      const query = {
        status: TodoStatus.PENDING,
      };

      apiService.getTodos.mockImplementation(() => {
        throw error;
      });

      await model.todosQuery.fetch(query);
      expect(loggerService.error).toHaveBeenCalledWith(error, query);
    });

    test('with polling', async () => {
      apiService.getTodo.mockImplementation(() => todo);
      await model.todoQuery.startPolling(1000);
      jest.advanceTimersByTime(1000);
      expect(setInterval).toHaveBeenCalled();
    });
  });

  describe('mutation', () => {
    test('simple', async () => {
      expect(model.createTodoMutation.status).toBe(Status.IDLE);
      const promise = model.createTodoMutation.mutate({
        data: todo,
      });
      expect(model.createTodoMutation.status).toBe(Status.LOADING);
      await promise;
      expect(model.createTodoMutation.status).toBe(Status.SUCCESS);
      expect(apiService.createTodo).toHaveBeenCalledWith({ data: todo });
    });

    test('that fails', async () => {
      apiService.createTodo.mockImplementation(() => {
        throw new Error();
      });
      expect(model.createTodoMutation.status).toBe(Status.IDLE);
      const promise = model.createTodoMutation.mutate({
        data: todo,
      });
      expect(model.createTodoMutation.status).toBe(Status.ERROR);
      await promise;
      expect(apiService.createTodo).toHaveBeenCalledWith({ data: todo });
      expect(model.createTodoMutation.error).toBeTruthy();
    });

    test('onSuccess called properly', async () => {
      apiService.createTodo.mockImplementation(() => todo);

      await model.createTodoMutation.mutate({
        data: todo,
      });
      expect(loggerService.success).toHaveBeenCalledWith(todo, {
        data: todo,
      });
    });

    test('onError called properly', async () => {
      const error = new Error();

      apiService.createTodo.mockImplementation(() => {
        throw error;
      });

      await model.createTodoMutation.mutate({
        data: todo,
      });
      expect(loggerService.error).toHaveBeenCalledWith(error, { data: todo });
    });
  });
});
