import * as E from "fp-ts/Either";
import { flow } from "fp-ts/function";
import * as Json from "fp-ts/Json";

// Prevent Union types from flatteing, usefull for Reader usage.
// e.g unknown | number will merge to unknown;
// type T1 = unknown | number = unknown;
// typesafeJsonParsing
export const parseJson = flow(
  Json.parse,
  E.mapLeft((u) => new SyntaxError(String(u))),
);
