import { validateProductionEnv } from "@/lib/env-validator";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    validateProductionEnv();
  }
}
