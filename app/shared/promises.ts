export class AlreadyResolvedError extends Error {}
export class AlreadyRejectedError extends Error {}

export function createResolvablePromise<T>() {
  let promiseResolve!: (value: T) => void;
  let promiseReject!: (reason: any) => void;
  let resolved = false;
  let rejected = false;

  const promise = new Promise<T>((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;
  });

  return {
    promise,
    get resolved() {
      return resolved;
    },
    get rejected() {
      return rejected;
    },
    resolve: (value: T) => {
      if (resolved) {
        throw new AlreadyResolvedError();
      }

      if (rejected) {
        throw new AlreadyRejectedError();
      }

      resolved = true;
      promiseResolve(value);
    },
    reject: (reason: any) => {
      if (resolved) {
        throw new AlreadyResolvedError();
      }

      if (rejected) {
        throw new AlreadyRejectedError();
      }

      rejected = true;
      promiseReject(reason);
    },
  };
}
