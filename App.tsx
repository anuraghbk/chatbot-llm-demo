import React, { useState, useRef, useEffect } from "react";

type Message = { sender: "user" | "bot"; text: string };

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { sender: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { sender: "bot", text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { sender: "bot", text: "Oops, something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) sendMessage();
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Barclays Virtual Agent</h2>
        <p style={styles.sidebarDesc}>
          Support chatbot for Barclays employees to get quick help.
        </p>
      </aside>

      <main style={styles.chatContainer}>
        <div style={styles.messages}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                ...(m.sender === "user" ? styles.userMsg : styles.botMsg),
              }}
            >
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            type="text"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
            style={styles.input}
          />
          <button onClick={sendMessage} disabled={loading} style={styles.button}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f0f2f5",
  },
  sidebar: {
    width: 280,
    backgroundColor: "#004b8d",
    color: "white",
    padding: "30px 20px",
    boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  sidebarTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: "700",
  },
  sidebarDesc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.4,
    color: "#cbd6e8",
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    maxWidth: 600,
    margin: "auto",
    backgroundColor: "white",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    overflow: "hidden",
    height: "100vh",
    maxHeight: "100vh",
  },
  messages: {
    flex: 1,
    padding: 20,
    overflowY: "auto",
    backgroundColor: "#f9fafb",
    maxHeight: 500, // fixed height of messages container
    minHeight: 500,
    display: "flex",
    flexDirection: "column",
  },
  message: {
    maxWidth: "75%",
    marginBottom: 14,
    padding: "12px 18px",
    borderRadius: 25,
    fontSize: 15,
    lineHeight: 1.5,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    wordWrap: "break-word",
  },
  userMsg: {
    backgroundColor: "#0070f3",
    color: "white",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botMsg: {
    backgroundColor: "#e4e7eb",
    color: "#222",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  inputArea: {
    display: "flex",
    padding: 16,
    borderTop: "1px solid #ddd",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    fontSize: 16,
    borderRadius: 25,
    border: "1px solid #ccc",
    outline: "none",
    marginRight: 12,
  },
  button: {
    padding: "12px 30px",
    fontSize: 16,
    borderRadius: 25,
    border: "none",
    backgroundColor: "#0070f3",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
};
