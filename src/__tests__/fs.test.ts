import * as fs from "node:fs/promises";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { beforeEach, describe, expect, test, vi } from "vitest";
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
    test("Reads filecontent", async () => {
      const filepath = "tasks.json";
      const filecontent = "[]";
      vi.mocked(fs.readFile).mockResolvedValue(filecontent);

      const result = await Filesystem.readFile(filepath)();

      expect(result).toStrictEqual(E.right(filecontent));
      expect(fs.readFile).toHaveBeenCalledWith(filepath, "utf-8");
    });

    test("Throws FilesystemError", async () => {
      const filepath = "tasks.json";
      const error = new Error("file not found");
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const result = await Filesystem.readFile(filepath)();

      expect(E.isLeft(result)).toBe(true);
      pipe(
        result,
        E.mapLeft((e) => {
          expect(e).toBeInstanceOf(FilesystemError);
        }),
      );
      expect(fs.readFile).toHaveBeenCalledWith(filepath, "utf-8");
    });
  });

  describe("writeFile", () => {
    test("Writes to filesystem", async () => {
      const filepath = "tasks.json";
      const filecontent = "[]";
      vi.mocked(fs.writeFile).mockResolvedValue();

      const result = await Filesystem.writeFile(filepath, filecontent)();

      expect(E.isRight(result)).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(filepath, filecontent, "utf-8");
    });

    test("Throws FilesystemError", async () => {
      const filepath = "tasks.json";
      const filecontent = "[]";
      const error = new Error("Permision denied");
      vi.mocked(fs.writeFile).mockRejectedValue(error);

      const result = await Filesystem.writeFile(filepath, filecontent)();

      pipe(
        result,
        E.mapLeft((e) => {
          expect(e).toBeInstanceOf(FilesystemError);
        }),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(filepath, filecontent, "utf-8");
    });
  });
});
