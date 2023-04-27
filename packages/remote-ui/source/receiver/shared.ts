export interface ReceiverOptions {
  retain?(value: any): void;
  release?(value: any): void;
}
