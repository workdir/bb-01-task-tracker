import * as fs from "node:fs/promises";
import * as baseFs from 'node:fs'
import * as E from "fp-ts/Either";
import { flow } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";

export class FilesystemError extends Error {
  _tag = "FilesystemError";
  constructor(message = "FilesystemError default" , options?: ErrorOptions) {
    super(message, options);
  }
}

export const Filesystem = {
  readFile: (path: string) =>
    TE.tryCatch(
      () => fs.readFile(path, "utf-8"),
      flow(E.toError, (error) => new FilesystemError(error.message, { cause: error })),
    ),
  writeFile: (path: string, content: string) =>
    TE.tryCatch(
      () => fs.writeFile(path, content, "utf-8"),
      flow(E.toError, (error) => new FilesystemError(error.message, { cause: error })),
    ),
};

export type Filesystem = { filesystem: typeof Filesystem };

const isNodeError = (error: unknown): error is NodeJS.ErrnoException => error instanceof Error;

export const isPathNotFoundError = (error: unknown) => isNodeError(error) && error.code === "ENOENT"; 

