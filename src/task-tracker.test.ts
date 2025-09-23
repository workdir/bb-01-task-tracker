import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TaskTracker } from './task-tracker'
import { Description, TaskEncoded } from './schema'
import * as RTE from 'fp-ts/ReaderTaskEither';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { Filesystem } from './fs';

const tasks: TaskEncoded[] = [{
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  description: 'description',
  status: 'in-progress',
  id: '1',
}]

const newTask = {
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  description: 'description',
  status: 'in-progress',
  id: '1',
} satisfies TaskEncoded; 


const filesystem: Filesystem = {
  readFile: (path: string) => TE.of(JSON.stringify(tasks)),
  writeFile: (path: string, content: string) => TE.rightIO(() => { 
  })
} 

describe('TaskTracker', () => {
  it('should add new task ', async () => {

    const description = 'new task description';
    if(!Description.is(description)) return;

    const addTask = pipe(
      RTE.ask<TaskTracker>(),
      RTE.map(taskTracker => taskTracker.add))

    expect(tasks).toHaveLength(2)     
    expect(tasks[1].description).toBe(description)
  });
}
