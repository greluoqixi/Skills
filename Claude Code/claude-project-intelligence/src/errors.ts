export class CpiError extends Error {
  constructor(
    message: string,
    readonly exitCode = 10,
    readonly details?: unknown
  ) {
    super(message);
  }
}
