import * as t from "io-ts";
import * as Either from "fp-ts/Either";
import { pipe } from "fp-ts/function";

export const NumberFromString = new t.Type<number, string>(
  "NumberFromString",
  t.number.is,
  (u, c) =>
    pipe(
      t.string.validate(u, c),
      Either.flatMap((s) => {
        const n = +s;
        return isNaN(n) || s.trim() === "" ? t.failure(u, c) : t.success(n);
      })
    ),
  String
);

export const DateFromISOString = new t.Type<Date, string>(
  "DateFromIOSString",
  (u): u is Date => u instanceof Date,
  (u, c) =>
    pipe(
      t.string.validate(u, c),
      Either.flatMap((s) => {
        const d = new Date(s);
        return isNaN(d.getTime()) ? t.failure(u, c) : t.success(d);
      })
    ),
  (a) => a.toISOString()
);

interface NonEmptyStringBrand {
  readonly NonEmptyString: unique symbol;
}

export type NonEmptyString = t.Branded<string, NonEmptyStringBrand>;
interface NonEmptyStringC extends t.Type<NonEmptyString, string, unknown> {}

export const NonEmptyString: NonEmptyStringC = t.brand(
  t.string,
  (s): s is NonEmptyString => s.length > 0,
  "NonEmptyString"
);
