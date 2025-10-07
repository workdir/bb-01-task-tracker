import { apply, flow, pipe } from "fp-ts/function";
import * as RA from "fp-ts/ReadonlyArray";
import * as S from "fp-ts/string";
import * as t from "io-ts";

const stringify = (v: any) => {
  if (typeof v === "function") {
    return t.getFunctionName(v);
  }
  if (typeof v === "number" && !isFinite(v)) {
    if (isNaN(v)) {
      return "NaN";
    }
    return v > 0 ? "Infinity" : "-Infinity";
  }
  return JSON.stringify(v);
};

const getContextPath = flow(
  RA.map<t.ContextEntry, string>(
    (context) => `${context.key}: ${context.type.name}`,
  ),
  pipe(RA.intercalate<string>, apply(S.Monoid), apply("/")),
);

const getMessage = (error: t.ValidationError) =>
  error.message
    ? error.message
    : `Invalid value ${stringify(error.value)} supplied to ${getContextPath}`;

export const stringifyValidationErrors = flow(
  RA.map<t.ValidationError, string>(getMessage),
  pipe(RA.intercalate<string>, apply(S.Monoid), apply("/n")),
);
