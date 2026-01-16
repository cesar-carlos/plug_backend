import { jwt } from "@elysiajs/jwt";
import { logger } from "../shared/utils/logger";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.fatal("JWT_SECRET environment variable is required");
  process.exit(1);
}

export const authPlugin = jwt({
  name: "jwt",
  secret: JWT_SECRET,
});
