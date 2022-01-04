import { TodosModel } from './testApi';

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

beforeEach(() => {
  jest.resetAllMocks();
  toolkit = createToolkit();
  toolkit.reset();
  model = new TodosModel(toolkit, apiService, loggerService);
});

describe('Test', () => {
  test('query', async () => {
    const todos = [
      {
        title: 'Todo 1',
        description: 'This is important',
        id: '1',
        status: 'Done',
      },
    ];

    apiService.getTodos.mockImplementation(() => todos);
    expect(model.todosQuery.status).toBe(Status.IDLE);
    const promise = model.todosQuery.fetch();
    expect(model.todosQuery.status).toBe(Status.LOADING);
    await promise;
    expect(model.todosQuery.status).toBe(Status.SUCCESS);
    expect(apiService.getTodos).toHaveBeenCalledTimes(1);
    expect(model.todosQuery.data).toEqual(todos);
  });

  test('mutation', async () => {
    const todo = {
      title: 'Todo 1',
      description: 'This is test todo',
      id: '1',
    };
    expect(model.createTodoMutation.status).toBe(Status.IDLE);
    const promise = model.createTodoMutation.mutate({
      data: todo,
    });
    expect(model.createTodoMutation.status).toBe(Status.LOADING);
    await promise;
    expect(model.createTodoMutation.status).toBe(Status.SUCCESS);
    expect(apiService.createTodo).toHaveBeenCalledWith({ data: todo });
  });

  test('query with options', async () => {
    const todo = {
      title: 'Todo 1',
      description: 'This is important',
      id: '1',
      status: 'Done',
    };
    apiService.getTodo.mockImplementation(() => todo);
    expect(model.todoQuery.status).toBe(Status.IDLE);
    const promise = model.todoQuery.fetch({ id: '1' });
    expect(model.todoQuery.status).toBe(Status.LOADING);
    await promise;
    expect(model.todoQuery.status).toBe(Status.SUCCESS);
    expect(model.todoQuery.data).toEqual(todo);
    expect(apiService.getTodo).toHaveBeenCalledTimes(1);
  });

  test('query that fails', async () => {
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

  test('mutation that fails', async () => {
    const todo = {
      title: 'Todo 1',
      description: 'This is test todo',
      id: '1',
    };

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
    expect(model.createTodoMutation.data).toBeNull();
    expect(model.createTodoMutation.error).toBeTruthy();
  });

  test('reset toolkit', async () => {
    const todos = [
      {
        title: 'Todo 1',
        description: 'This is important',
        id: '1',
        status: 'Done',
      },
    ];
    apiService.getTodos.mockImplementation(() => todos);

    await model.todosQuery.fetch();

    expect(toolkit.queryCache.getEntries().todos).toBeTruthy();

    toolkit.reset();

    expect(toolkit.queryCache.getEntries().todos).toBeUndefined();
  });

  test('invalidate cache', async () => {
    const todos = [
      {
        title: 'Todo 1',
        description: 'This is important',
        id: '1',
        status: 'Done',
      },
    ];
    apiService.getTodos.mockImplementation(() => todos);

    await model.todosQuery.fetch();

    expect(toolkit.queryCache.getEntries().todos).toBeTruthy();

    await toolkit.queryCache.invalidateQuery({ baseKey: 'todos' });

    expect(toolkit.queryCache.getEntries().todos).toBeUndefined();
  });

  test('query reading from cache', async () => {
    const todos = [
      {
        title: 'Todo 1',
        description: 'This is important',
        id: '1',
        status: 'Done',
      },
    ];

    const todosUpdated = [
      {
        title: 'Todo 1 - Updated',
        description: 'This is important',
        id: '1',
        status: 'Done',
      },
    ];

    apiService.getTodos.mockImplementation(() => todos);

    await model.todosQuery.fetch();

    expect(model.todosQuery.data).toEqual(todos);

    apiService.getTodos.mockImplementation(() => todosUpdated);

    await model.todosQuery.fetch();

    expect(model.todosQuery.data).toEqual(todos);
  });
  test('query onSuccess called properly', async () => {
    const todos = [
      {
        title: 'Todo 1',
        description: 'This is important',
        id: '1',
        status: 'Done',
      },
    ];

    apiService.getTodos.mockImplementation(() => todos);

    await model.todosQuery.fetch();
    expect(loggerService.success).toHaveBeenCalledWith(todos, undefined);
  });

  test('query onError called properly', async () => {
    const error = new Error();

    apiService.getTodos.mockImplementation(() => {
      throw error;
    });

    await model.todosQuery.fetch();
    expect(loggerService.error).toHaveBeenCalledWith(error, undefined);
  });

  test('mutation onSuccess called properly', async () => {
    const todo = {
      title: 'Todo 1',
      description: 'This is test todo',
      id: '1',
    };

    apiService.createTodo.mockImplementation(() => todo);

    await model.createTodoMutation.mutate({
      data: todo,
    });
    expect(loggerService.success).toHaveBeenCalledWith(todo, { data: todo });
  });

  test('mutation onError called properly', async () => {
    const todo = {
      title: 'Todo 1',
      description: 'This is test todo',
      id: '1',
    };

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
