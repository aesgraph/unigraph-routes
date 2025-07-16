import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(500).json({ error: "Missing Supabase config" });
    return;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      }
    );
    const data = (await response.json()) as {
      access_token?: string;
      user?: object;
      [key: string]: any;
    };
    if (!response.ok) {
      res.status(response.status).json(data);
      return;
    }
    res.status(200).json({ access_token: data.access_token, user: data.user });
  } catch (error) {
    res.status(500).json({ error: "Failed to obtain JWT", details: error });
  }
}
