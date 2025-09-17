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
    E.flatMap(s => {
      const trimmed = s.trim();
      return trimmed.length ? t.success(trimmed as Trim) : t.failure(u, c)
    })
  ),
  identity 
)

