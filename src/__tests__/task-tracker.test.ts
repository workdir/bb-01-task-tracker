import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import type * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Filesystem } from "@/fs";
import { type Description, Status, Task, type TaskEncoded } from "@/schema";
import { Storage } from "@/storage";
import { TaskTracker } from "@/task-tracker";

// Mock data
const mockTasks: TaskEncoded[] = [
  {
    id: "1",
    description: "Buy groceries",
    status: "todo",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    description: "Walk the dog",
    status: "in-progress",
    createdAt: "2023-01-02T00:00:00.000Z",
    updatedAt: "2023-01-02T00:00:00.000Z",
  },
];

// Mock Filesystem
const mockFilesystem: Filesystem = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
};

// Create a mock Storage instance using the mock Filesystem
const mockStorage = Storage(mockFilesystem);

// Helper to run ReaderTaskEither
const runTaskTracker = <A>(rte: RTE.ReaderTaskEither<any, any, A>) =>
  rte({ storage: mockStorage })();

describe("TaskTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return a list of tasks", async () => {
      // Arrange
      vi.mocked(mockFilesystem.readFile).mockResolvedValue(
        JSON.stringify(mockTasks),
      );

      // Act
      const result = await runTaskTracker(TaskTracker.list());

      // Assert
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toEqual(
          mockTasks
            .map(Task.decode)
            .filter(E.isRight)
            .map((r) => r.right),
        );
      }
      expect(mockFilesystem.readFile).toHaveBeenCalledWith(
        "tasks.json",
        "utf-8",
      );
    });

    it("should return an error if reading tasks fails", async () => {
      // Arrange
      const error = new Error("File read error");
      vi.mocked(mockFilesystem.readFile).mockRejectedValue(error);

      // Act
      const result = await runTaskTracker(TaskTracker.list());

      // Assert
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left).toBeInstanceOf(Error); // Storage wraps the error
        expect(result.left.message).toContain("Failed to decode tasks");
      }
    });
  });

  describe("add", () => {
    it("should add a new task and return the updated list", async () => {
      // Arrange
      const newDescription: Description = "New task to add";
      vi.mocked(mockFilesystem.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockTasks)) // For initial read in insert
        .mockResolvedValueOnce(
          JSON.stringify([
            // For list after insert
            ...mockTasks,
            {
              id: "3", // Assuming simple ID generation
              description: newDescription,
              status: "todo",
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          ]),
        );
      vi.mocked(mockFilesystem.writeFile).mockResolvedValue(undefined);

      // Act
      const result = await runTaskTracker(TaskTracker.add(newDescription));

      // Assert
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(mockTasks.length + 1);
        expect(result.right[2].description).toBe(newDescription);
        expect(result.right[2].status).toBe("todo");
      }
      expect(mockFilesystem.writeFile).toHaveBeenCalledTimes(1);
      const writtenContent = JSON.parse(
        vi.mocked(mockFilesystem.writeFile).mock.calls[0][1],
      );
      expect(writtenContent).toHaveLength(mockTasks.length + 1);
      expect(writtenContent[2].description).toBe(newDescription);
    });

    it("should return an error if adding task fails", async () => {
      // Arrange
      const newDescription: Description = "New task to add";
      const error = new Error("Write file error");
      vi.mocked(mockFilesystem.readFile).mockResolvedValue(
        JSON.stringify(mockTasks),
      );
      vi.mocked(mockFilesystem.writeFile).mockRejectedValue(error);

      // Act
      const result = await runTaskTracker(TaskTracker.add(newDescription));

      // Assert
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left).toBeInstanceOf(Error);
        expect(result.left.message).toContain("Failed to encode tasks");
      }
    });
  });

  describe("delete", () => {
    it("should delete a task and return the updated list", async () => {
      // Arrange
      const taskIdToDelete = "1";
      vi.mocked(mockFilesystem.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockTasks)) // For initial read in delete
        .mockResolvedValueOnce(JSON.stringify([mockTasks[1]])); // For list after delete
      vi.mocked(mockFilesystem.writeFile).mockResolvedValue(undefined);

      // Act
      const result = await runTaskTracker(TaskTracker.delete(taskIdToDelete));

      // Assert
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(mockTasks.length - 1);
        expect(
          result.right.find((task) => task.id === taskIdToDelete),
        ).toBeUndefined();
      }
      expect(mockFilesystem.writeFile).toHaveBeenCalledTimes(1);
      const writtenContent = JSON.parse(
        vi.mocked(mockFilesystem.writeFile).mock.calls[0][1],
      );
      expect(writtenContent).toHaveLength(mockTasks.length - 1);
      expect(
        writtenContent.find((task: TaskEncoded) => task.id === taskIdToDelete),
      ).toBeUndefined();
    });

    it("should return an error if deleting task fails", async () => {
      // Arrange
      const taskIdToDelete = "1";
      const error = new Error("Write file error");
      vi.mocked(mockFilesystem.readFile).mockResolvedValue(
        JSON.stringify(mockTasks),
      );
      vi.mocked(mockFilesystem.writeFile).mockRejectedValue(error);

      // Act
      const result = await runTaskTracker(TaskTracker.delete(taskIdToDelete));

      // Assert
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left).toBeInstanceOf(Error);
        expect(result.left.message).toContain("Failed to encode tasks");
      }
    });
  });

  describe("update", () => {
    it("should return the current list if task to update is not found", async () => {
      // Arrange
      const nonExistentId = "99";
      const updates = { description: "Updated description" as Description };
      vi.mocked(mockFilesystem.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockTasks)) // For getById
        .mockResolvedValueOnce(JSON.stringify(mockTasks)); // For list after update

      // Act
      const result = await runTaskTracker(
        TaskTracker.update(nonExistentId, updates),
      );

      // Assert
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toEqual(
          mockTasks
            .map(Task.decode)
            .filter(E.isRight)
            .map((r) => r.right),
        );
      }
      expect(mockFilesystem.writeFile).not.toHaveBeenCalled(); // No write should happen if task not found
    });

    // I will add the successful update test after fixing the bug in task-tracker.ts
  });
});
