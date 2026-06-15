/**
 * Base class for domain-layer errors (README §2.2 Rule 1 — domain throws its
 * own typed errors with no framework coupling). The global exception filter
 * maps `httpStatus` to the HTTP response, keeping the domain free of NestJS.
 */
export abstract class DomainError extends Error {
  /** HTTP status the presentation layer should surface for this error. */
  abstract readonly httpStatus: number;
  /** Stable machine-readable code for clients. */
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
