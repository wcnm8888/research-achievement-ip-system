import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  buildCorsOptions,
  validateRuntimeConfig,
  warnIfBootstrapEnabled,
} from "./config/production-config";

async function bootstrap() {
  const runtimeConfig = validateRuntimeConfig();
  warnIfBootstrapEnabled(runtimeConfig);

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  const corsOptions = buildCorsOptions(runtimeConfig);
  if (corsOptions) {
    app.enableCors(corsOptions);
  }

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
