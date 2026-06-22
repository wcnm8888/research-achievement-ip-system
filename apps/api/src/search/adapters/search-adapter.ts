import { SearchAdapterInput, SearchAdapterResult } from "../domain/search-domain.types";

export const SEARCH_ADAPTER = Symbol("SEARCH_ADAPTER");

export type SearchAdapter = {
  search(input: SearchAdapterInput): Promise<SearchAdapterResult>;
};
