import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { pipe, identity } from "fp-ts/function";

export interface TrimBrand {
  readonly Trim: unique symbol;
}

export type Trim = t.Branded<string, TrimBrand>

export interface TrimC extends t.Type<Trim, string, unknown> {}

export const Trim: TrimC = new t.Type<Trim, string, unknown>(
  "Trim",
  (input: unknown): input is Trim => t.string.is(input) && input.trim().length === input.length,
  (u, c) => pipe(
    t.string.validate(u, c),
    E.map(s => s.trim() as Trim)
  ),
  identity 
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

