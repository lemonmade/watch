import {EventEmitter, on} from 'events';

import {parse} from 'graphql';

import {
  execute,
  createQueryResolver as createQueryResolverForSchema,
} from './live';
import type {GraphQLLiveQueryResolverCreateHelper} from './live';
import type {GraphQLLiveResolverObject} from '.';

/* eslint-disable @typescript-eslint/ban-types */
interface Person {
  __typename: 'Person';
  name(variables: {}): string;
  pets(variables: {}): Pet[];
  school(variables: {}): School | null;
}

interface School {
  __typename: 'School';
  name(variables: {}): string;
  age(variables: {}): number;
}

interface Cat {
  __typename: 'Cat';
  age(variables: {}): number | null;
  name(variables: {}): string;
}

interface Dog {
  __typename: 'Dog';
  name(variables: {}): string;
  age(variables: {}): number | null;
  breed(variables: {}): string | null;
}

interface Pet {
  __possibleTypes: Cat | Dog;
}

interface Schema {
  Query: {
    __typename: 'Query';
    version(variables: {}): string;
    me(variables: {}): Person;
  };
  Person: Person;
  School: School;
  Cat: Cat;
  Dog: Dog;
  Pet: Pet;
}

/* eslint-enable @typescript-eslint/ban-types */

describe('execute()', () => {
  it('returns static field values', async () => {
    const query = parse(`query { version }`);

    const resolver = createQueryResolver(() => ({
      version: 'v1',
    }));

    const result = await execute(query, resolver).untilDone();

    expect(result).toStrictEqual({version: 'v1'});
  });

  it('returns nullish field values', async () => {
    const query = parse(`query { me { school { grade } } }`);

    const resolver = createQueryResolver(({object}) => ({
      me: object('Person', {
        name: 'Chris',
        pets: [],
        school: undefined,
      }),
    }));

    const result = await execute(query, resolver).untilDone();

    expect(result).toStrictEqual({me: {school: null}});
  });

  it('returns nested field selections', async () => {
    const query = parse(`query { me { school { age } } }`);

    const resolver = createQueryResolver(({object}) => ({
      me: object('Person', {
        name: 'Chris',
        pets: [],
        school: object('School', {
          name: 'Gloucester High School',
          age: () => Promise.resolve(10),
        }),
      }),
    }));

    const result = await execute(query, resolver).untilDone();

    expect(result).toStrictEqual({me: {school: {age: 10}}});
  });

  it('returns field selections on lists', async () => {
    const query = parse(`query { me { pets { name } } }`);

    const resolver = createQueryResolver(({object}) => ({
      me: object('Person', {
        name: 'Chris',
        pets: [
          object('Dog', {name: 'Winston'}),
          object('Dog', {name: 'Molly'}),
        ],
      }),
    }));

    const result = await execute(query, resolver).untilDone();

    expect(result).toStrictEqual({
      me: {pets: [{name: 'Winston'}, {name: 'Molly'}]},
    });
  });

  describe('inline fragments', () => {
    it('returns inline fragment selections on concrete types', async () => {
      const query = parse(`
        query { me { pets { __typename ... on Dog { breed } } } }
      `);

      const resolver = createQueryResolver(({object}) => ({
        me: object('Person', {
          name: 'Chris',
          pets: [
            object('Dog', {name: 'Molly'}),
            object('Dog', {name: 'Winston', breed: 'Black Lab'}),
            object('Cat', {name: 'Luna'}),
          ],
        }),
      }));

      const result = await execute(query, resolver).untilDone();

      expect(result).toStrictEqual({
        me: {
          pets: [
            {__typename: 'Dog', breed: null},
            {__typename: 'Dog', breed: 'Black Lab'},
            {__typename: 'Cat'},
          ],
        },
      });
    });
  });

  describe('fragment spreads', () => {
    it('returns fragment spreads on concrete types', async () => {
      const query = parse(`
        query { me { pets { __typename ...DogFragment } } }
        fragment DogFragment on Dog { breed }
      `);

      const resolver = createQueryResolver(({object}) => ({
        me: object('Person', {
          name: 'Chris',
          pets: [
            object('Dog', {name: 'Molly'}),
            object('Dog', {name: 'Winston', breed: 'Black Lab'}),
            object('Cat', {name: 'Luna'}),
          ],
        }),
      }));

      const result = await execute(query, resolver).untilDone();

      expect(result).toStrictEqual({
        me: {
          pets: [
            {__typename: 'Dog', breed: null},
            {__typename: 'Dog', breed: 'Black Lab'},
            {__typename: 'Cat'},
          ],
        },
      });
    });
  });

  describe('promises', () => {
    it('returns field values that return promises', async () => {
      const query = parse(`query { version }`);

      const resolver = createQueryResolver(() => ({
        version: () => Promise.resolve('v1'),
      }));

      const result = await execute(query, resolver).untilDone();

      expect(result).toStrictEqual({version: 'v1'});
    });
  });

  describe('iterators', () => {
    it('yields for field values that return iterators', async () => {
      const spy = jest.fn();
      const query = parse(`query { version }`);

      const resolver = createQueryResolver(() => ({
        version: () => iterate(['v1', 'v2', 'v3']),
      }));

      for await (const result of execute(query, resolver)) {
        spy(result);
      }

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenLastCalledWith({version: `v3`});
    });

    it('yields for iterators in nested selections', async () => {
      const spy = jest.fn();
      const query = parse(`query { me { name } }`);

      const resolver = createQueryResolver(({object}) => ({
        me: object('Person', {
          name: () => iterate(['Chris 1', 'Chris 2', 'Chris 3']),
          pets: [],
        }),
      }));

      for await (const result of execute(query, resolver)) {
        spy(result);
      }

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith({me: {name: `Chris 3`}});
    });

    it('yields for nested iterators', async () => {
      const spy = jest.fn();
      const query = parse(`query { me { pets { name age } } }`);

      const resolver = createQueryResolver(({object}) => ({
        me: object('Person', {
          name: 'Chris',
          pets: () =>
            iterate([
              [],
              [
                object('Dog', {name: 'Molly'}),
                object('Dog', {
                  name: 'Winston',
                  age: () => iterate([8, 9, 10]),
                }),
              ],
            ]),
        }),
      }));

      for await (const result of execute(query, resolver)) {
        spy(result);
      }

      expect(spy).toHaveBeenCalledTimes(4);
      expect(spy).toHaveBeenCalledWith({
        me: {
          pets: [
            {name: 'Molly', age: null},
            {name: 'Winston', age: 10},
          ],
        },
      });
    });

    it('cancels yielding for iterators when ancestor iterators change', async () => {
      const query = parse(`query { me { school { name age } } }`);

      const highSchool = {
        name: 'Gloucester High School',
        currentAge: createAsyncIterator(20),
      };

      const university = {
        name: 'Carleton University',
        currentAge: createAsyncIterator(10),
      };

      const currentSchool = createAsyncIterator(highSchool);

      const resolver = createQueryResolver(({object}) => ({
        me: object('Person', {
          name: 'Chris',
          pets: [],
          async *school() {
            for await (const school of currentSchool.iterate()) {
              yield object('School', {
                name: school.name,
                async *age() {
                  for await (const age of school.currentAge.iterate()) {
                    yield age;
                  }
                },
              });
            }
          },
        }),
      }));

      const iterator = execute(query, resolver)[Symbol.asyncIterator]();

      expect(await iterator.next()).toStrictEqual({
        done: false,
        value: {
          me: {school: {name: highSchool.name, age: 20}},
        },
      });

      await currentSchool.yield(university);

      expect(await iterator.next()).toStrictEqual({
        done: false,
        value: {
          me: {school: {name: university.name, age: 10}},
        },
      });

      await highSchool.currentAge.yield(21);

      const nextPromiseSpy = jest.fn((value) => value);
      const nextPromise = iterator.next().then(nextPromiseSpy);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(nextPromiseSpy).not.toHaveBeenCalled();

      await university.currentAge.yield(11);

      expect(await nextPromise).toStrictEqual({
        done: false,
        value: {
          me: {school: {name: university.name, age: 11}},
        },
      });
    });
  });
});

function createQueryResolver(
  fields?: (
    helpers: GraphQLLiveQueryResolverCreateHelper<Schema>,
  ) => Partial<Omit<GraphQLLiveResolverObject<Schema['Query']>, '__typename'>>,
) {
  return createQueryResolverForSchema<Schema>((helpers) => ({
    version: 'v1',
    me: helpers.object('Person', {
      name: 'Chris',
      pets: [],
    }),
    ...fields?.(helpers),
  }));
}

async function* iterate<T>(values: Iterable<T>) {
  for (const value of values) {
    await sleep(0);
    yield value;
  }
}

function sleep(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration));
}

function createAsyncIterator<T>(initialValue: T) {
  let currentValue = initialValue;

  const emitter = new EventEmitter();

  emitter.on('yield', (value) => {
    currentValue = value;
  });

  return {
    async yield(value: T) {
      emitter.emit('yield', value);
    },
    async *iterate({
      signal,
    }: {
      signal?: AbortSignal;
    } = {}): AsyncGenerator<T, void, void> {
      yield currentValue;

      for await (const [value] of on(emitter, 'yield', {signal})) {
        yield value;
      }
    },
  };
}
