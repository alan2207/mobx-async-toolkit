# mobx-async-toolkit

[![NPM](https://img.shields.io/npm/v/mobx-async-toolkit.svg)](https://www.npmjs.com/package/mobx-async-toolkit)

Toolkit for handling async operations in MobX stores

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Contributing](#contributing)
- [LICENSE](#license)

## Prerequisites

It is required to have `mobx` installed.

## Installation

```
$ npm install mobx-async-toolkit
```

With Yarn:

```
$ yarn add mobx-async-toolkit
```

## Usage

First of all, a `Toolkit` instance must be created and exported.

```ts
// src/lib/toolkit.ts

import { createToolkit } from 'mobx-async-toolkit';

export const toolkit = createToolkit();
```

Then it can be used to create queries and mutations as following:

```ts
import { makeAutoObservable } from 'mobx';
import {
  createTodo,
  CreateTodoOptions,
  getTodo,
  GetTodoOptions,
  getTodos,
  GetTodosOptions,
  Todo,
} from '../lib/api';
import { toolkit } from '../lib/toolkit';

export class TodoStore {
  constructor() {
    makeAutoObservable(this);
  }

  todoQuery = toolkit.createQuery<Todo, GetTodoOptions>({
    fn: getTodo,
    key: 'todo',
  });

  todosQuery = toolkit.createQuery<Todo[], GetTodosOptions>({
    fn: getTodos,
    key: 'todos',
  });

  createTodoMutation = toolkit.createMutation<Todo, CreateTodoOptions>({
    fn: createTodo,
  });
}
```

Then a query can be consumed as following:

```ts
const todoStore = new TodoStore();

todoStore.todosQuery.data;
todoStore.todosQuery.status;
todoStore.todosQuery.error;
todoStore.todosQuery.fetch(options);
todoStore.todosQuery.refetch();
```

And here is a mutation:

```ts
import { toolkit } from '../../lib/toolkit';

const todoStore = new TodoStore();

const handleSubmit = (data: CreateTodoOptions) => {
  await todoStore.createTodoMutation.mutate(data);

  // refetch data after a mutation:
  await this.model.todosQuery.refetch();
};

todoStore.createTodoMutation.status;
todoStore.createTodoMutation.error;
```

## API

### `createToolkit`

Function that creates and returns a `Toolkit` instance.

```ts
// src/lib/auth.ts
export const toolkit = createToolkit();
```

### `Toolkit`

Organizes queries and mutations.

```ts
// src/lib/auth.ts
export const toolkit = createToolkit();
```

###### `Toolkit` options

A `Toolkit` instance will have the following properties and methods:

- `createQuery: (options: QueryOptions & {key: string}) => Query`

  - creates a new `Query` instance
  - If `key` is provided, the query will be treated as a singleton.

- `createMutation: (options: MutationOptions) => Mutation`

  - creates a new `Mutation` instance

### `Query`

Controls and tracks the lifecycle of a query

```ts
const todosQuery = toolkit.createQuery<Todo[], GetTodosOptions>({
  fn: getTodos,
  key: 'todos',
});
```

#### `QueryOptions`:

- `fn: (options?: Options) => Promise<Data>`

  - function that fetches data

  - once resolved, its return value will be set as the `data` property of the query

- `onSuccess: (data: Data, options?: Options) => void`

  - called if the query succeeds

- `onError: (error: Error, options?: Options) => void`
  - called if the query fails

###### A `Query` instance will have the following properties and methods:

- `data: Data | null`

  - state of the data that is being fetched

- `status: Status`

  - status of a query

- `error: Error`

  - error of a query

- `fetch: (options?: Options) => Promise<Data | undefined>`

  - triggers a query to start fetching the data

- `refetch: () => Promise<Data | undefined>`

  - re-runs latest `fetch` call

- `startPolling: (interval: number, options: Options) => Promise<void>`

  - fetches data on passed `interval`

- `stopPolling: () => void)`

  - stops polling

- `isIdle: boolean`
- `isLoading: boolean`
- `isSuccess: boolean`
- `isError: boolean`

### `Mutation`

Controls and tracks the lifecycle of a mutation

```ts
const createTodoMutation = toolkit.createMutation<Todo, CreateTodoOptions>({
  fn: createTodo,
});
```

#### `MutationOptions`:

- `fn: (options?: Options) => Promise<data | undefined>`

  - function that calls mutation operation

- `onSuccess: (data: Data, options?: Options) => void`

  - called if the mutation succeeds

- `onError: (error: Error, options?: Options) => void`
  - called if the mutation fails

###### A `Mutation` instance will have the following properties and methods:

- `status: Status`

  - status of a query

- `error: Error`

  - error of a query

- `mutate: (options?: Options): Promise<Data | undefined>`

  - triggers a mutation operation

- `isIdle: boolean`
- `isLoading: boolean`
- `isSuccess: boolean`
- `isError: boolean`

## Contributing

1. Clone this repo
2. Create a branch: `git checkout -b your-feature`
3. Make some changes
4. Test your changes
5. Push your branch and open a Pull Request

## LICENSE

MIT
