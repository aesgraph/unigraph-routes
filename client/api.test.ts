import { config } from "dotenv";
config();
import { supabaseLogin, chatgptMessage } from "./api";

const TEST_EMAIL = "aesgraph.dev@gmail.com";
const TEST_PASSWORD = "testing909";

async function runIntegrationTest() {
  try {
    console.log("testing here");
    const login = (await supabaseLogin(TEST_EMAIL, TEST_PASSWORD)) as {
      access_token: string;
      user: object;
    };
    console.log("Login success:", login);

    const chat = (await chatgptMessage(
      "Hello, ChatGPT!",
      login.access_token
    )) as { reply: string };
    console.log("ChatGPT reply:", chat.reply);
  } catch (err) {
    console.error("Integration test failed:", err);
  }
}

runIntegrationTest();
