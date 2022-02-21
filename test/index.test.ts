import { TodosModel, TodosModelOptions, TodoStatus } from './testApi';

import { createToolkit, Status, Toolkit } from '../src/index';

const apiService = {
  getTodo: jest.fn(),
  getTodos: jest.fn(),
  createTodo: jest.fn(),
};

const loggerService = {
  success: jest.fn(),
  error: jest.fn(),
};

let model: TodosModel;
let toolkit: Toolkit;

const todo1 = {
  title: 'Todo 1',
  description: 'This is important',
  id: '1',
  status: TodoStatus.PENDING,
};

const todo2 = {
  title: 'Todo 1',
  description: 'This is important',
  id: '1',
  status: TodoStatus.DONE,
};

const todos1 = [todo1];
const todos2 = [todo2];

const todoModelOptions: TodosModelOptions = {
  todo: {
    id: '1',
  },
  todos: {
    status: TodoStatus.PENDING,
  },
};

jest.useFakeTimers();
jest.spyOn(global, 'setInterval');

beforeEach(() => {
  jest.resetAllMocks();
  toolkit = createToolkit();
  model = new TodosModel(toolkit, apiService, loggerService, todoModelOptions);
});

describe('Test', () => {
  describe('query', () => {
    test('simple', async () => {
      apiService.getTodos.mockImplementation(() => todos1);
      expect(model.todosQuery.status).toBe(Status.IDLE);
      const promise = model.todosQuery.startQuery();
      expect(model.todosQuery.status).toBe(Status.LOADING);
      await promise;
      expect(model.todosQuery.status).toBe(Status.SUCCESS);
      expect(apiService.getTodos).toHaveBeenCalledTimes(1);
      expect(model.todosQuery.data).toEqual(todos1);
    });

    test('with options', async () => {
      apiService.getTodo.mockImplementation(() => todo1);
      expect(model.todoQuery.status).toBe(Status.IDLE);
      const promise = model.todoQuery.startQuery();
      expect(model.todoQuery.status).toBe(Status.LOADING);
      await promise;
      expect(model.todoQuery.status).toBe(Status.SUCCESS);
      expect(model.todoQuery.data).toEqual(todo1);
      expect(apiService.getTodo).toHaveBeenCalledTimes(1);
      expect(apiService.getTodo).toHaveBeenCalledWith({ id: '1' });
    });

    test('with optionsOverride', async () => {
      apiService.getTodo.mockImplementation(() => todo1);
      expect(model.todoQuery.status).toBe(Status.IDLE);
      const promise = model.todoQuery.startQuery({
        optionsOverride: { id: '2' },
      });
      expect(model.todoQuery.status).toBe(Status.LOADING);
      await promise;
      expect(model.todoQuery.status).toBe(Status.SUCCESS);
      expect(model.todoQuery.data).toEqual(todo1);
      expect(apiService.getTodo).toHaveBeenCalledTimes(1);
      expect(apiService.getTodo).toHaveBeenCalledWith({ id: '2' });
    });

    test('that fails', async () => {
      apiService.getTodos.mockImplementation(() => {
        throw new Error();
      });
      expect(model.todosQuery.status).toBe(Status.IDLE);
      const promise = model.todosQuery.startQuery();
      expect(model.todosQuery.status).toBe(Status.ERROR);
      await promise;
      expect(model.todosQuery.status).toBe(Status.ERROR);
      expect(apiService.getTodos).toHaveBeenCalledTimes(1);
      expect(model.todosQuery.data).toBeNull();
      expect(model.todosQuery.error).toBeTruthy();
    });

    test('with cache invalidation', async () => {
      apiService.getTodos.mockImplementation(() => todos1);

      await model.todosQuery.startQuery();

      expect(toolkit.queryCache.getEntries().todos).toBeTruthy();

      const promise = toolkit.queryCache.invalidateQuery({ baseKey: 'todos' });

      expect(toolkit.queryCache.getEntries().todos).toBeUndefined();

      await promise;

      expect(apiService.getTodos).toHaveBeenCalledTimes(2);

      expect(toolkit.queryCache.getEntries().todos).not.toBeUndefined();
    });

    test('read from cache', async () => {
      apiService.getTodos.mockImplementation(() => todos1);

      await model.todosQuery.startQuery();

      expect(model.todosQuery.data).toEqual(todos1);

      apiService.getTodos.mockImplementation(() => todos2);

      await model.todosQuery.startQuery();

      expect(model.todosQuery.data).toEqual(todos1);
    });

    test('with requests deduping', async () => {
      await Promise.all(
        [1, 2, 3, 4, 5].map(() => model.todosQuery.startQuery())
      );

      expect(apiService.getTodos).toHaveBeenCalledTimes(1);
    });

    test('onSuccess called properly', async () => {
      apiService.getTodos.mockImplementation(() => todos1);

      await model.todosQuery.startQuery();
      expect(loggerService.success).toHaveBeenCalledWith(todos1, {
        status: 'Pending',
      });
    });

    test('onError called properly', async () => {
      const error = new Error();

      apiService.getTodos.mockImplementation(() => {
        throw error;
      });

      await model.todosQuery.startQuery();
      expect(loggerService.error).toHaveBeenCalledWith(error, {
        status: 'Pending',
      });
    });

    test('with cached disabled', async () => {
      const toolkit = createToolkit({
        cacheTime: 0,
      });
      const model = new TodosModel(
        toolkit,
        apiService,
        loggerService,
        todoModelOptions
      );

      apiService.getTodos.mockImplementation(() => todos1);
      await model.todosQuery.startQuery();
      expect(toolkit.queryCache.getEntries()).toEqual({});
    });

    test('with refetchInterval', async () => {
      apiService.getTodo.mockImplementation(() => todo1);
      await model.todoQuery.startQuery({ refetchInterval: 1000 });
      jest.advanceTimersByTime(1000);
      expect(setInterval).toHaveBeenCalled();
    });
  });

  describe('mutation', () => {
    test('simple', async () => {
      expect(model.createTodoMutation.status).toBe(Status.IDLE);
      const promise = model.createTodoMutation.mutate({
        data: todo1,
      });
      expect(model.createTodoMutation.status).toBe(Status.LOADING);
      await promise;
      expect(model.createTodoMutation.status).toBe(Status.SUCCESS);
      expect(apiService.createTodo).toHaveBeenCalledWith({ data: todo1 });
    });

    test('that fails', async () => {
      apiService.createTodo.mockImplementation(() => {
        throw new Error();
      });
      expect(model.createTodoMutation.status).toBe(Status.IDLE);
      const promise = model.createTodoMutation.mutate({
        data: todo1,
      });
      expect(model.createTodoMutation.status).toBe(Status.ERROR);
      await promise;
      expect(apiService.createTodo).toHaveBeenCalledWith({ data: todo1 });
      expect(model.createTodoMutation.data).toBeNull();
      expect(model.createTodoMutation.error).toBeTruthy();
    });

    test('onSuccess called properly', async () => {
      apiService.createTodo.mockImplementation(() => todo1);

      await model.createTodoMutation.mutate({
        data: todo1,
      });
      expect(loggerService.success).toHaveBeenCalledWith(todo1, {
        data: todo1,
      });
    });

    test('onError called properly', async () => {
      const error = new Error();

      apiService.createTodo.mockImplementation(() => {
        throw error;
      });

      await model.createTodoMutation.mutate({
        data: todo1,
      });
      expect(loggerService.error).toHaveBeenCalledWith(error, { data: todo1 });
    });
  });

  test('toolkit reset', async () => {
    apiService.getTodos.mockImplementation(() => todos1);

    await model.todosQuery.startQuery();

    expect(toolkit.queryCache.getEntries().todos).toBeTruthy();

    toolkit.reset();

    expect(toolkit.queryCache.getEntries().todos).toBeUndefined();
  });
});
