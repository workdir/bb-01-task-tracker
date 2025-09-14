import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as fs from "node:fs/promises";
import { flow } from 'fp-ts/function'

class FilesystemError extends Error {
  _tag = "FilesystemError"
  constructor(message: string) {
    super(message);
  }
}

export const readFile = (path: string) =>
  TE.tryCatch(
    () => fs.readFile(path, "utf-8"), 
    flow(E.toError, (e) => new FilesystemError(e.message))
  );

export const writeFile = (path: string, content: string) =>
  TE.tryCatch(
    () => fs.writeFile(path, content),
    flow(E.toError, (e) => new FilesystemError(e.message))
  );
