const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const session = require("express-session"); // <-- add session
const { InferenceClient } = require("@huggingface/inference");

const HF_TOKEN = "hf_XXXXXXXXXXXXXXXXXXXX";
const client = new InferenceClient(HF_TOKEN);

const app = express();

app.use(cors({
  origin: "http://localhost:3001", // your React app URL, adjust as needed
  credentials: true,  // allow cookies to be sent
}));
app.use(express.json());

app.use(session({
  secret: "your-very-secure-secret-here",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false, // set to true if using HTTPS
    maxAge: 1000 * 60 * 60, // 1 hour session
    sameSite: "lax",
  }
}));

const db = new Database("chat.db");
db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

app.post("/chat", async (req, res) => {
  const userMsg = req.body.message?.trim();
  if (!userMsg) return res.status(400).json({ error: "Empty message" });

  const sessionId = req.session.id;

  db.prepare("INSERT INTO messages (session_id, sender, text) VALUES (?, ?, ?)")
    .run(sessionId, "user", userMsg);

  try {
    const completion = await client.chatCompletion({
      provider: "cohere",
      model: "CohereLabs/c4ai-command-r-plus",
      messages: [{ role: "user", content: userMsg }],
    });

    const reply = completion.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    db.prepare("INSERT INTO messages (session_id, sender, text) VALUES (?, ?, ?)")
      .run(sessionId, "bot", reply);

    res.json({ reply });

  } catch (err) {
    console.error(err);
    const errorReply = "Oops, something went wrong generating the response.";

    db.prepare("INSERT INTO messages (session_id, sender, text) VALUES (?, ?, ?)")
      .run(sessionId, "bot", errorReply);

    res.json({ reply: errorReply });
  }
});

app.get("/messages", (req, res) => {
  const sessionId = req.session.id;
  const messages = db.prepare("SELECT sender, text FROM messages WHERE session_id = ? ORDER BY id ASC")
    .all(sessionId);
  res.json({ messages });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
