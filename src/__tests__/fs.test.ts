import * as fs from "node:fs/promises";
import * as E from "fp-ts/Either";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Filesystem, FilesystemError } from "@/fs";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Filesystem", () => {
  describe("readFile", () => {
    // Arrange -> Act -> Assert
    it("should read and return filecontent successfully", async () => {
      const filepath = "tasks.json";
      const filecontent = "[]";
      vi.mocked(fs.readFile).mockResolvedValue(filecontent);

      const result = await Filesystem.readFile(filepath)();

      if (E.isLeft(result)) {
        throw new Error("Test arranged for a success but it fails");
      }

      expect(result.right).toBe(filecontent);
      expect(fs.readFile).toHaveBeenCalledWith(filepath, "utf-8");
    });

    it("should throw an error if file reading fails", async () => {
      const filepath = "tasks.json";
      const error = new Error("file not found");
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const result = await Filesystem.readFile(filepath)();

      if (E.isRight(result)) {
        throw new Error("Test arranged for a failure but it succeedes");
      }

      expect(result.left).toBeInstanceOf(FilesystemError);
      expect(fs.readFile).toHaveBeenCalledWith(filepath, "utf-8");
    });
  });

  describe("writeFile", () => {
    it("should write filecontent successfully", async () => {
      const filepath = "tasks.json";
      const filecontent = "[]";
      vi.mocked(fs.writeFile).mockResolvedValue();

      const result = await Filesystem.writeFile(filepath, filecontent)();

      expect(E.isRight(result)).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(filepath, filecontent, "utf-8");
    });

    it("should throw an error if file writing fails", async () => {
      const filepath = "tasks.json";
      const filecontent = "[]";
      const error = new Error("Permision denied");
      vi.mocked(fs.writeFile).mockRejectedValue(error);

      const result = await Filesystem.writeFile(filepath, filecontent)();

      if (E.isRight(result)) {
        throw new Error("Test arranged for a failure but it succeedes");
      }
      expect(result.left).toBeInstanceOf(FilesystemError);
      expect(fs.writeFile).toHaveBeenCalledWith(filepath, filecontent, "utf-8");
    });
  });
});
