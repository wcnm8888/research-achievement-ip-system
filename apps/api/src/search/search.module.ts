import { Module } from "@nestjs/common";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { DatabaseSearchAdapter } from "./adapters/database-search.adapter";
import { SEARCH_ADAPTER } from "./adapters/search-adapter";
import { SearchController } from "./search.controller";
import { SearchRepository } from "./search.repository";
import { SearchService } from "./search.service";

@Module({
  imports: [DatabaseModule, AuthorizationModule, IdentityModule],
  controllers: [SearchController],
  providers: [
    SearchRepository,
    DatabaseSearchAdapter,
    SearchService,
    {
      provide: SEARCH_ADAPTER,
      useExisting: DatabaseSearchAdapter,
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}
