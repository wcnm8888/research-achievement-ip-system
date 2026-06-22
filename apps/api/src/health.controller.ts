import { Controller, Get } from "@nestjs/common";

type HealthResponse = {
  service: string;
  status: "ok";
};

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      service: "research-achievement-ip-api",
      status: "ok",
    };
  }
}
