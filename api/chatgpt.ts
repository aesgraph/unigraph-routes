import type { VercelRequest, VercelResponse } from "@vercel/node";

// Use globalThis.fetch for compatibility in Node.js environments
const fetchFn =
  typeof fetch !== "undefined" ? fetch : (globalThis as any).fetch;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const EMAIL_WHITELIST = [
  "aesgraph@gmail.com",
  "allowed2@example.com",
  // ...add more emails...
];

async function getUserEmail(jwt: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const resp = await fetchFn(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.email || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: "Missing message in request body" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing OpenAI API key" });
    return;
  }

  // Supabase Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const jwt = authHeader.split(" ")[1];
  const email = await getUserEmail(jwt);
  if (!email || !EMAIL_WHITELIST.includes(email)) {
    res.status(403).json({ error: "Forbidden: email not whitelisted" });
    return;
  }

  try {
    const response = await fetchFn(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json(data);
      return;
    }

    res.status(200).json({ reply: data.choices?.[0]?.message?.content || "" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to contact ChatGPT API", details: error });
  }
}
