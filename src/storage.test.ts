import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NonEmptyString } from 'io-ts-types';
import * as fs from 'node:fs/promises';
import { } from './storage'
import { TaskEncoded } from './schema';
import { Filesystem } from './fs'
import { FilesystemStorage } from './storage'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'

const testTasksFilepath = 'test-tasks.json' as NonEmptyString;

describe('FilesystemStorage', () => {

  let tasks: TaskEncoded[] = [{
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'description',
    status: 'in-progress',
    id: '1',
  }]

  const filesystem: Filesystem = {
    readFile: (path: string) => TE.of(JSON.stringify(tasks)),
    writeFile: (path: string, content: string) => TE.rightIO(() => {})
  } 

  const config = { tasksFilepath: 'tasksFilepath' as NonEmptyString }

  const filesystemStorage = FilesystemStorage({ ...filesystem, ...config })

  
  beforeAll(async () => {
    tasks = [{
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: 'description',
      status: 'in-progress',
      id: '1',
    }]
  });

  afterAll(async () => {
  });

  it('should get all tasks from the file', async () => {
    const tasks = await pipe(
      filesystemStorage,
      TE.flatMap((filesystemStorage) => { return filesystemStorage.getAll() })
    )()

    pipe(
      tasks,
      E.map(tasks => {
        console.log(tasks)
        expect(tasks).lengthOf(1)
        pipe(
          tasks,
          A.head,
          O.map((task) => {
            expect(1).toBe(3)
            expect(task.id).toBe(2)
          })
        )
      }),
      E.mapLeft(error => {
        
        console.dir(error.cause, {depth: null})
      })
    )
  });

  it('should insert a new task', async () => {
    /**
     * TODO: Implementation
     */
  });

  it('should get a task by its id', async () => {
    /**
     * TODO: Implementation
     */
  });

  it('should return an option none if task does not exist', async () => {
    /**
     * TODO: Implementation
     */
  });

  it('should update an existing task', async () => {
    /**
     * TODO: Implementation
     */
  });

  it('should not update a non-existent task', async () => {
    /**
     * TODO: Implementation
     */
  });

  it('should delete an existing task', async () => {
    /**
     * TODO: Implementation
     */
  });

  it('should not delete a non-existent task', async () => {
    /**
     * TODO: Implementation
     */
  });

  it('should create the tasks file if it does not exist on insert', async () => {
    /**
     * TODO: Implementation
     */
  });

  it('should return a storage error if the file is not valid json', async () => {
    /**
     * TODO: Implementation
     */
  });

  it('should return a storage error if the tasks are not valid', async () => {
    /**
     * TODO: Implementation
     */
  });
});
