import { headers } from "next/headers";

/**
 * Validates the internal API key from the Authorization header.
 * Expected format: Bearer <TOKEN>
 */
export async function validateApiRequest(req: Request) {
  const headerList = await headers();
  const authHeader = headerList.get("authorization");
  const internalSecret = process.env.INTERNAL_API_KEY;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];
  return token === internalSecret;
}
