import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as fs from "node:fs/promises";

export const readFile = (path: string) =>
  TE.tryCatch(() => fs.readFile(path, "utf-8"), E.toError);

export const writeFile = (path: string, content: string) =>
  TE.tryCatch(() => fs.writeFile(path, content), E.toError);
