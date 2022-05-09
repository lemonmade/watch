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
  partner(variables: {}): Person | null;
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
    const query = parse(`query { me { partner } }`);

    const resolver = createQueryResolver(({object}) => ({
      me: object('Person', {
        name: 'Chris',
        pets: [],
      }),
    }));

    const result = await execute(query, resolver).untilDone();

    expect(result).toStrictEqual({me: {partner: null}});
  });

  it('returns nested field selections', async () => {
    const query = parse(`query { me { partner { name } } }`);

    const resolver = createQueryResolver(({object}) => ({
      me: object('Person', {
        name: 'Chris',
        pets: [],
        partner: object('Person', {
          name: () => Promise.resolve('Mik'),
          pets: [],
        }),
      }),
    }));

    const result = await execute(query, resolver).untilDone();

    expect(result).toStrictEqual({me: {partner: {name: 'Mik'}}});
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
