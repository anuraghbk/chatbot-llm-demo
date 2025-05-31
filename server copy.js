const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const { InferenceClient } = require("@huggingface/inference");

const HF_TOKEN = "hf_XXXXXXXXXXXXXXXXx"; // Replace with your token
const client = new InferenceClient(HF_TOKEN);

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database("chat.db");
db.prepare(
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
).run();

app.post("/chat", async (req, res) => {
  const userMsg = req.body.message?.trim();
  if (!userMsg) return res.status(400).json({ error: "Empty message" });

  db.prepare("INSERT INTO messages (sender, text) VALUES (?, ?)").run("user", userMsg);

  try {
    const completion = await client.chatCompletion({
      provider: "cohere",
      model: "CohereLabs/c4ai-command-r-plus",
      messages: [{ role: "user", content: userMsg }],
    });

    const reply = completion.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    db.prepare("INSERT INTO messages (sender, text) VALUES (?, ?)").run("bot", reply);
    res.json({ reply });

  } catch (err) {
    console.error(err);
    const errorReply = "Oops, something went wrong generating the response.";
    db.prepare("INSERT INTO messages (sender, text) VALUES (?, ?)").run("bot", errorReply);
    res.json({ reply: errorReply });
  }
});

app.get("/messages", (req, res) => {
  const messages = db.prepare("SELECT sender, text FROM messages ORDER BY id ASC").all();
  res.json({ messages });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
