import { getApiKey } from "@/lib/session";

export async function GET() {
  const apiKey = await getApiKey();
  return Response.json({ authenticated: !!apiKey });
}
