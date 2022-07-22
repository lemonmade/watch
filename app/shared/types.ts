export type ThenType<T> = T extends PromiseLike<infer U> ? U : never;

export type ArrayElement<T> = T extends (infer U)[] ? U : never;
