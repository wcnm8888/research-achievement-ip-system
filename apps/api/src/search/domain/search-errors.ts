export class SearchAccessDeniedError extends Error {
  constructor(message = "Search access denied.") {
    super(message);
    this.name = "SearchAccessDeniedError";
  }
}
