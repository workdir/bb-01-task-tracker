import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";

export interface TrimBrand {
  readonly Trimmed: unique symbol;
}

export type Trim = t.Branded<string, TrimBrand>

export interface TrimC extends t.Type<Trim, string, unknown> {}

export const Trim: TrimC = new t.Type<Trim, string, unknown>(
  "Trim",
  (input: unknown): input is Trim => typeof input === 'string',
  (u, c) => pipe(
    t.string.validate(u, c),
    E.flatMap(s => {
      const trimmed = s.trim();
      return t.success(trimmed as Trim)
    })
  ),
  String
)

export const withDefault = <C extends t.Mixed>(codec: C, defaultValue: t.TypeOf<C>) =>
  new t.Type<t.TypeOf<C>, unknown>(
    `withDefault(${codec.name}, ${defaultValue})`,
    codec.is,
    (input, context) =>
      input === undefined || input === null
        ? E.right(defaultValue)
        : codec.validate(input, context),
    codec.encode
  );

