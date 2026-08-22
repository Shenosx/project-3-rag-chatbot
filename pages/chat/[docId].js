import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

export default function ChatDocPage() {
  const router = useRouter();
  const { docId } = router.query;

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const askQuestion = async () => {
    if (!question.trim() || !docId || loading) {
      return;
    }

    const userQuestion = question.trim();

    setQuestion("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userQuestion,
      },
      {
        role: "assistant",
        content: "",
        sources: [],
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: Number(docId),
          query: userQuestion,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      if (!response.body) {
        throw new Error("Streaming is not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const events = buffer.split("\n\n");

        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");

          let eventType = "message";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.replace("event:", "").trim();
            }

            if (line.startsWith("data:")) {
              data += line.replace("data:", "").trim();
            }
          }

          if (!data) {
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (eventType === "sources") {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;

                updated[lastIndex] = {
                  ...updated[lastIndex],
                  sources: parsed,
                };

                return updated;
              });
            }

            if (eventType === "message") {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;

                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content:
                    updated[lastIndex].content + (parsed.text || ""),
                };

                return updated;
              });
            }

            if (eventType === "error") {
              throw new Error(parsed.error || "AI response failed");
            }
          } catch (parseError) {
            console.error("SSE parsing error:", parseError);
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        updated[lastIndex] = {
          ...updated[lastIndex],
          content: `Error: ${error.message}`,
        };

        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askQuestion();
    }
  };

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>AI Document Chat</h1>

      <p
        style={{
          color: "#666",
          marginBottom: "30px",
        }}
      >
        Document ID: {docId}
      </p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "20px",
          minHeight: "450px",
          marginBottom: "20px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#777",
              paddingTop: "150px",
            }}
          >
            <h2>Ask questions about your document</h2>
            <p>
              The AI will search the document and answer using relevant
              sources.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: "20px",
              textAlign: message.role === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "12px",
                background:
                  message.role === "user" ? "#0070f3" : "#f1f1f1",
                color: message.role === "user" ? "white" : "#222",
                textAlign: "left",
                whiteSpace: "pre-wrap",
              }}
            >
              {message.content ||
                (message.role === "assistant" && loading
                  ? "Thinking..."
                  : "")}
            </div>

            {message.role === "assistant" &&
              message.sources &&
              message.sources.length > 0 && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  <strong>Sources:</strong>

                  {message.sources.map((source, sourceIndex) => (
                    <span key={source.id}>
                      {" "}
                      [Source {sourceIndex + 1}]
                    </span>
                  ))}
                </div>
              )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your document..."
          disabled={loading}
          rows={3}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            resize: "vertical",
            fontSize: "16px",
          }}
        />

        <button
          onClick={askQuestion}
          disabled={loading || !question.trim()}
          style={{
            padding: "0 24px",
            borderRadius: "8px",
            border: "none",
            background: loading ? "#aaa" : "#0070f3",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </main>
  );
}