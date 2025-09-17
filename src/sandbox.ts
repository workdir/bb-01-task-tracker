import * as t from 'io-ts';
import { mapOutput } from 'io-ts-types';
import { PathReporter } from 'io-ts/PathReporter'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

// Define the tuple type
const TupleType = t.tuple([t.string, t.number]);

// Define the output interface
interface KeyValue {
  key: string;
  value: number;
}

// Transform the tuple to an object
const KeyValueType = mapOutput(
  TupleType,
  ([key, value]): KeyValue => ({ key, value })
);

// Example usage
const input: unknown = ['key', 2];

const result = KeyValueType.decode(input);

console.log(PathReporter.report(result))

pipe(
  result,
  E.map(console.log)
)

