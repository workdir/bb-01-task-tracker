import * as Applicatvie from "fp-ts/Applicative";
import * as A from "fp-ts/Array";
import * as B from "fp-ts/boolean";
import * as Console from "fp-ts/Console";
import * as D from "fp-ts/Date";
// import * as Date from "fp-ts/Date";
import * as E from "fp-ts/Either";
import * as Eq from "fp-ts/Eq";
import { apply, flow, pipe } from "fp-ts/function";
import { ap } from "fp-ts/Identity";
import * as IO from "fp-ts/IO";
import * as IOE from "fp-ts/IOEither";
import * as Monoid from "fp-ts/Monoid";
import * as M from "fp-ts/Monoid";
import * as N from "fp-ts/number";
import * as Option from "fp-ts/Option";
import * as O from "fp-ts/Option";
import * as Ord from "fp-ts/Ord";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as Semigroup from "fp-ts/Semigroup";
import * as Sem from "fp-ts/Semigroup";
import * as S from "fp-ts/string";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import { Config } from "@/config";
import { Filesystem } from "@/fs";
import { Logger } from "@/logger";
import { makeTask, Task } from "@/schema.compound";
import { Description, Priority, Status } from "@/schema.simple";
import * as TE from 'fp-ts/TaskEither'

interface Judge {
  name: string;
  workingExpInYears: number;
}

const byExperience = Ord.contramap<number, Judge>(
  (judge) => judge.workingExpInYears,
)(N.Ord);
const byName = Ord.contramap<string, Judge>((judge) => judge.name)(S.Ord);

const judges: Judge[] = [
  { name: "Brandon", workingExpInYears: 2 },
  { name: "Tonny", workingExpInYears: 3 },
  { name: "Ash", workingExpInYears: 2 },
];

const judgeSemigroup = Ord.getSemigroup<Judge>();

// hmm this is are challenge
// judgeSemigroup.concat(byName, byExperience)

const ww = A.sortBy([byExperience, byName])(judges);
const by = judgeSemigroup.concat(byExperience, byName);
const sorted = A.sort(by)(judges);
const dualSorted = A.sort(Ord.reverse(by))(judges);

console.log({
  byExperience: A.sort(byExperience)(judges),
  byExperienceAndName: A.sortBy([byExperience, byName])(judges),
});

// What information need to be computed
// finding a task amoung others

const findByName = (name: string) =>
  A.findFirst<Judge>((judge) => judge.name === name);

const s = A.getSemigroup<Judge>()

const task = TE.of('buy a bitcoin')
const optionTask = O.of(task)

const as = O.sequence(TE.ApplicativeSeq)(optionTask)
