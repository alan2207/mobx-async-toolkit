# mobx-async-toolkit

[![NPM](https://img.shields.io/npm/v/mobx-async-toolkit.svg)](https://www.npmjs.com/package/mobx-async-toolkit)

Toolkit for handling async operations in MobX stores

## Introduction

Fetching and caching remote data is a tricky thing to do. There are a lot of things that need to be considered such as all the fetching states, cache invalidation, organizing all those states in a proper way etc. Fortunately in recent years a lot of great tools that solves these problems have been made such as react-query, apollo-client, swr, urlq, redux-toolkit-query. This is a simple solution that can be used with MobX in a similar way as the tools mentioned above. It is completely UI agnostic, all you need is `mobx` as a peerDependency.

## Features

- Easy To Use
- Requests Caching
- Requests Deduping

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

Or if you use Yarn:

```
$ yarn add mobx-async-toolkit
```

## Usage

First of all, a `Toolkit` instance must be created and exported.

```ts
// src/lib/toolkit.ts

import { createToolkit } from 'mobx-async-toolkit';

export const toolkit = createToolkit({
  isCacheEnabled: true,
});
```

Then it can be used to create queries and mutations as following:

```ts
import { makeAutoObservable } from 'mobx';
import {
  createTodo,
  CreateTodoOptions,
  deleteTodo,
  DeleteTodoOptions,
  getTodo,
  GetTodoOptions,
  getTodos,
  GetTodosOptions,
  Todo,
  updateTodo,
  UpdateTodoOptions,
} from '../lib/api';
import { toolkit } from '../lib/toolkit';

export class TodoStore {
  constructor() {
    makeAutoObservable(this);
  }

  todoQuery = toolkit.createQuery<Todo, GetTodoOptions>({
    fn: getTodo,
    baseKey: 'todo',
  });

  todosQuery = toolkit.createQuery<Todo[], GetTodosOptions>({
    fn: getTodos,
    baseKey: 'todos',
  });

  createTodoMutation = toolkit.createMutation<Todo, CreateTodoOptions>({
    fn: createTodo,
  });

  updateTodoMutation = toolkit.createMutation<Todo[], UpdateTodoOptions>({
    fn: updateTodo,
  });

  deleteTodoMutation = toolkit.createMutation<
    Todo | undefined,
    DeleteTodoOptions
  >({
    fn: deleteTodo,
  });
}
```

Then a query can be consumed like this:

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

  // invalidating a query will cause its cache
  // to be cleared and the data to be fetched again

  await toolkit.queryCache.invalidateQuery({
    baseKey: 'todos',
  });
};

todoStore.createTodoMutation.status;
todoStore.createTodoMutation.error;
```

## API

### `createToolkit`

Function that creates and returns `Toolkit`.

```ts
// src/lib/auth.ts
export const toolkit = createToolkit();
```

### `Toolkit`

The class that organizes queries, mutations and queryCache to work properly

```ts
// src/lib/auth.ts
export const toolkit = createToolkit();
```

A `Toolkit` instance will have the following properties and methods:

- `createMutation: function`

  - creates new mutations

- `createQuery: function`

  - creates new query
  - if a query with the same key exists it will return the same instance

- `queryCache: QueryCache`

  - queryCache instance used by the queries

### `Query`

The class that controls and tracks the lifecycle of a query

```ts
const todosQuery = toolkit.createQuery<Todo[], GetTodosOptions>({
  fn: getTodos,
  baseKey: 'todos',
});
```

A `Query` instance will have the following properties and methods:

- `data: Data | null`

  - state of the data that is being fetched

- `status: Status`

  - status of a query

- `error: Error`

  - error of a query

- `fetch: function`

  - triggers a query to start fetching the data

- `refetch: function`

  - triggers a query to start fetching the data
  - it will also invalidate any cached data so it will be fresh

- `isIdle: () => boolean`
- `isLoading: () => boolean`
- `isSuccess: () => boolean`
- `isError: () => boolean`

### `Mutation`

The class that controls and tracks the lifecycle of a mutation

```ts
const createTodoMutation = toolkit.createMutation<Todo, CreateTodoOptions>({
  fn: createTodo,
});
```

A `Mutation` instance will have the following properties and methods:

- `data: Data | null`

  - state of the data that is being fetched

- `status: Status`

  - status of a query

- `error: Error`

  - error of a query

- `mutate: function`

  - triggers a mutation

- `isIdle: () => boolean`
- `isLoading: () => boolean`
- `isSuccess: () => boolean`
- `isError: () => boolean`

### `QueryCache`

The class that controls and tracks all the cached data

A `QueryCache` instance will have the following properties and methods:

- `getQueryData: function`

  - returns cached data if found or `undefined` if not

- `setQueryData: function`

  - sets the newly fetched data in cache

- `invalidateQuery: function`

  - invalidates a query
  - it will remove the cached query
  - it will fetch again all required queries

- `getEntries: function`

  - returns all the cached data

- `clear: function`

  - clears the cached data

## Contributing

1. Clone this repo
2. Create a branch: `git checkout -b your-feature`
3. Make some changes
4. Test your changes
5. Push your branch and open a Pull Request

## LICENSE

MIT
