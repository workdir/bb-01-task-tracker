import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as fs from "node:fs/promises";
import * as RTE from 'fp-ts/ReaderTaskEither'
import { flow, pipe } from 'fp-ts/function'

export class FilesystemError extends Error {
  _tag = "FilesystemError"
  constructor(message: string) {
    super(message);
  }
}

export const Filesystem = {
  readFile: (path: string) =>
    TE.tryCatch(
      () => fs.readFile(path, "utf-8"),
      flow(E.toError, (e) => new FilesystemError(e.message))
    ),
  writeFile: (path: string, content: string) =>
    TE.tryCatch(
      () => fs.writeFile(path, content, 'utf-8'),
      flow(E.toError, (e) => new FilesystemError(e.message))
    )
}

export type Filesystem = { filesystem: typeof Filesystem };




