const API_BASE = process.env.API_BASE_URL || "http://localhost:3001/api";

type SupabaseLoginResponse = {
  access_token: string;
  user: object;
  error?: string;
};

type ChatGPTResponse = {
  reply: string;
  error?: string;
};

export async function supabaseLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/supabase-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // Debug the response
  const contentType = res.headers.get("content-type");
  let data;

  try {
    if (contentType && contentType.includes("application/json")) {
      data = (await res.json()) as SupabaseLoginResponse;
    } else {
      // For non-JSON responses (like HTML error pages)
      const textResponse = await res.text();
      console.error(
        "Non-JSON response received:",
        textResponse.substring(0, 200) + "..."
      );
      throw new Error(
        `Server returned non-JSON response: ${res.status} ${res.statusText}`
      );
    }
  } catch (error) {
    console.error("Error parsing response:", error);
    throw error;
  }

  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function chatgptMessage(message: string, jwt: string) {
  const res = await fetch(`${API_BASE}/chatgpt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ message }),
  });
  const data = (await res.json()) as ChatGPTResponse;
  if (!res.ok) throw new Error(data.error || "ChatGPT request failed");
  return data;
}
