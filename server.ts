import express from "express";
import { config } from "dotenv";
import chatgptHandler from "./api/chatgpt";
import supabaseLoginHandler from "./api/supabase-login";
import indexHandler from "./api/index";

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware for parsing JSON
app.use(express.json());

// Convert Vercel handlers to Express
const vercelToExpress =
  (handler: any) => async (req: express.Request, res: express.Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("Route error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

// Routes
app.get("/api", vercelToExpress(indexHandler));
app.post("/api/chatgpt", vercelToExpress(chatgptHandler));
app.post("/api/supabase-login", vercelToExpress(supabaseLoginHandler));

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API endpoint: http://localhost:${port}/api`);
});
