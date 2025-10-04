import * as E from "fp-ts/Either";
import { identity, pipe } from "fp-ts/function";
import * as t from "io-ts";
import { PathReporter } from 'io-ts/PathReporter'

export interface TrimBrand {
  readonly Trim: unique symbol;
}

export type Trim = t.Branded<string, TrimBrand>;

const unsafeTrim = (s: string): Trim => s as any;

export const Trim = new t.Type<Trim, string, unknown>(
  "Trim",
  (input: unknown): input is Trim => t.string.is(input),
  (u, c) =>
    pipe(
      t.string.validate(u, c),
      E.flatMap((s) => t.success(unsafeTrim(s))),
    ),
  identity,
);


export const unsafeMake = <C extends t.Mixed, E = t.OutputOf<C>, D = t.TypeOf<C>>(codec: C) => (encoded: E): D =>  
  pipe(
    codec.decode(encoded),
    E.getOrElseW((errors) => {
      throw new Error(PathReporter.report(E.left(errors)).join(","));
    }),
  );

