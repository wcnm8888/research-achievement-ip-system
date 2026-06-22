import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { PermissionCode } from "../authorization/constants/permission-code";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import { RequirePermissions } from "../authorization/decorators/require-permissions.decorator";
import { PermissionGuard } from "../authorization/guards/permission.guard";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import { UserContext } from "../identity/user-context";
import { SearchAccessDeniedError } from "./domain/search-errors";
import { SearchQueryDto } from "./dto/search-query.dto";
import { SearchService } from "./search.service";

const searchValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const searchValidationPipe = new ValidationPipe(searchValidationOptions);
const searchQueryValidationPipe = new ValidationPipe({
  ...searchValidationOptions,
  expectedType: SearchQueryDto,
});

@Controller("search")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(searchValidationPipe)
export class SearchController {
  constructor(
    @Inject(SearchService)
    private readonly searchService: SearchService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.userContextRead)
  async search(
    @CurrentUser() currentUser: UserContext,
    @Query(searchQueryValidationPipe) query: SearchQueryDto = {},
  ) {
    try {
      return await this.searchService.search(currentUser, query);
    } catch (error) {
      throw mapSearchServiceError(error);
    }
  }
}

const mapSearchServiceError = (error: unknown): Error => {
  if (error instanceof SearchAccessDeniedError) {
    return new ForbiddenException(error.message);
  }

  return error instanceof Error ? error : new Error("Unknown search service error.");
};
