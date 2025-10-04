import * as fs from "node:fs/promises";
import * as E from "fp-ts/Either";
import { flow } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";

export class FilesystemError extends Error {
  _tag = "FilesystemError";
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export const Filesystem = {
  readFile: (path: string) =>
    TE.tryCatch(
      () => fs.readFile(path, "utf-8"),
      flow(E.toError, (e) => new FilesystemError(e.message, { cause: e })),
    ),
  writeFile: (path: string, content: string) =>
    TE.tryCatch(
      () => fs.writeFile(path, content, "utf-8"),
      flow(E.toError, (e) => new FilesystemError(e.message, { cause: e })),
    ),
};

export type Filesystem = { filesystem: typeof Filesystem };
