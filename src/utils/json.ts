import * as E from "fp-ts/Either";
import { flow } from "fp-ts/function";
import * as Json from "fp-ts/Json";
import type * as t from "io-ts";

// Prevent Union types from flatteing, usefull for Reader usage.
// e.g unknown | number will merge to unknown;
// type T1 = unknown | number = unknown;
// typesafeJsonParsing
export const parseJson = flow(
  Json.parse,
  E.mapLeft((u) => new SyntaxError(String(u))),
);

const stringifyJson = flow(
  Json.stringify,
  E.mapLeft((u) => new SyntaxError(String(u))),
);

export const decodeFromJson = <A, O>(codec: t.Type<A, O, unknown>) =>
  flow(parseJson, E.flatMap(codec.decode));

export const encodeToJson = <A, O>(codec: t.Type<A, O, unknown>) =>
  flow(codec.encode, stringifyJson);
