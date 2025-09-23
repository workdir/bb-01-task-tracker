import { Task } from "./schema";

export const presentTask = (task: Task): string => {
  return `  - [${task.id}] ${task.description} (${task.status})`;
};

export const presentTasks = (tasks: Task[]): string => {
  if (tasks.length === 0) {
    return "No tasks found.";
  }
  return tasks.map(presentTask).join("\n");
};

export const presentError = (error: Error): string => {
  return `Error: ${error.message}`;
};
