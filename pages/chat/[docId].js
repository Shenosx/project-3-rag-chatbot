import React, { useState } from "react";
import { useRouter } from "next/router";

export default function ChatDocPage() {
  const router = useRouter();
  const { docId } = router.query;

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async (question) => {
    const text = question.trim();

    if (!text || !docId || loading) return;

    setQuery("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
      },
      {
        role: "assistant",
        content: "",
        sources: [],
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: Number(docId),
          query: text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");

          const eventType = lines
            .find((line) => line.startsWith("event:"))
            ?.replace("event:", "")
            .trim();

          const dataLine = lines.find((line) =>
            line.startsWith("data:")
          );

          if (!dataLine) continue;

          const data = JSON.parse(
            dataLine.replace("data:", "").trim()
          );

          if (eventType === "message") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated.length - 1;

              updated[last] = {
                ...updated[last],
                content:
                  updated[last].content + data.text,
              };

              return updated;
            });
          }

          if (eventType === "sources") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated.length - 1;

              updated[last] = {
                ...updated[last],
                sources: data,
              };

              return updated;
            });
          }

          if (eventType === "error") {
            throw new Error(
              data.error || "Claude streaming failed"
            );
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.length - 1;

        updated[last] = {
          ...updated[last],
          content:
            "Sorry, something went wrong while answering your question.",
        };

        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    askQuestion(query);
  };

  const suggestedQuestions = [
    "What is the CGPA?",
    "What is the student's GPA?",
    "What are the total cumulative credits?",
  ];

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <a href="/" className="brand">
            <span className="logo">✦</span>
            <span>AI Document Chat</span>
          </a>

          <a href="/documents" className="documentsLink">
            Documents
          </a>
        </header>

        <section className="hero">
          <div className="badge">
            ✦ AI-powered document assistant
          </div>

          <h1>
            Ask questions about
            <span> your document.</span>
          </h1>

          <p>
            Get accurate answers from your PDF using semantic
            search and AI-powered document retrieval.
          </p>
        </section>

        <section className="chatCard">

          <div className="documentInfo">
            <div>
              <div className="documentIcon">📄</div>

              <div>
                <strong>Document {docId}</strong>
                <span>AI-powered document analysis</span>
              </div>
            </div>

            <div className="status">
              <span className="statusDot" />
              Ready
            </div>
          </div>

          <div className="messages">

            {messages.length === 0 && (
              <div className="emptyState">

                <div className="emptyIcon">
                  ✦
                </div>

                <h2>
                  What would you like to know?
                </h2>

                <p>
                  Ask a question about the information
                  contained in your document.
                </p>

                <div className="suggestions">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => askQuestion(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>

              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`messageRow ${message.role}`}
              >
                <div className="avatar">
                  {message.role === "user" ? "You" : "✦"}
                </div>

                <div className="messageContent">

                  <div className="messageLabel">
                    {message.role === "user"
                      ? "You"
                      : "AI Assistant"}
                  </div>

                  <div className="bubble">
                    {message.content ||
                      (loading &&
                        index === messages.length - 1 && (
                          <span className="typing">
                            <i />
                            <i />
                            <i />
                          </span>
                        ))}
                  </div>

                  {message.role === "assistant" &&
                    message.sources?.length > 0 && (
                      <div className="sources">

                        <div className="sourcesTitle">
                          Sources
                        </div>

                        <div className="sourceList">
                          {message.sources.map(
                            (source, sourceIndex) => (
                              <span
                                className="source"
                                key={source.id}
                              >
                                [Source {sourceIndex + 1}]
                              </span>
                            )
                          )}
                        </div>

                      </div>
                    )}

                </div>
              </div>
            ))}

          </div>

          <form
            className="inputArea"
            onSubmit={handleSubmit}
          >
            <textarea
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Ask a question about your document..."
              disabled={loading}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
            />

            <button
              type="submit"
              disabled={loading || !query.trim()}
            >
              {loading ? "Thinking..." : "Send"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="inputHint">
            Press Enter to send · Shift + Enter for a new line
          </div>

        </section>

      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 50% 0%,
              #eef2ff 0,
              #f8fafc 38%,
              #ffffff 75%
            );
          color: #111827;
          padding: 24px;
        }

        .container {
          max-width: 1050px;
          margin: 0 auto;
        }

        .header {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #111827;
          text-decoration: none;
          font-weight: 700;
          font-size: 18px;
        }

        .logo {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(
            135deg,
            #6366f1,
            #4f46e5
          );
          box-shadow:
            0 8px 20px rgba(79, 70, 229, 0.25);
        }

        .documentsLink {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 600;
        }

        .hero {
          text-align: center;
          padding: 62px 20px 40px;
        }

        .badge {
          display: inline-block;
          padding: 8px 14px;
          border-radius: 999px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .hero h1 {
          font-size: clamp(40px, 6vw, 64px);
          line-height: 1.05;
          letter-spacing: -3px;
          margin: 0;
          font-weight: 800;
        }

        .hero h1 span {
          display: block;
          color: #4f46e5;
        }

        .hero p {
          max-width: 650px;
          margin: 22px auto 0;
          color: #64748b;
          font-size: 17px;
          line-height: 1.7;
        }

        .chatCard {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          box-shadow:
            0 25px 70px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .documentInfo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: #fafbff;
        }

        .documentInfo > div:first-child {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .documentIcon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #eef2ff;
          font-size: 19px;
        }

        .documentInfo strong,
        .documentInfo span {
          display: block;
        }

        .documentInfo span {
          color: #94a3b8;
          font-size: 13px;
          margin-top: 3px;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #16a34a;
          font-size: 13px;
          font-weight: 600;
        }

        .statusDot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
        }

        .messages {
          min-height: 470px;
          max-height: 620px;
          overflow-y: auto;
          padding: 30px;
        }

        .emptyState {
          text-align: center;
          padding: 65px 20px;
        }

        .emptyIcon {
          width: 56px;
          height: 56px;
          margin: 0 auto 18px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 24px;
        }

        .emptyState h2 {
          margin: 0;
          font-size: 22px;
        }

        .emptyState p {
          color: #64748b;
          margin: 10px auto 24px;
          max-width: 500px;
        }

        .suggestions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .suggestions button {
          border: 1px solid #dbe3f0;
          background: white;
          border-radius: 12px;
          padding: 10px 14px;
          color: #475569;
          cursor: pointer;
          transition: 0.2s;
        }

        .suggestions button:hover {
          border-color: #818cf8;
          color: #4f46e5;
          transform: translateY(-1px);
        }

        .messageRow {
          display: flex;
          gap: 12px;
          margin-bottom: 25px;
        }

        .messageRow.user {
          flex-direction: row-reverse;
        }

        .avatar {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
        }

        .messageRow.user .avatar {
          background: #4f46e5;
          color: white;
        }

        .messageContent {
          max-width: 75%;
        }

        .messageRow.user .messageContent {
          text-align: right;
        }

        .messageLabel {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 6px;
        }

        .bubble {
          display: inline-block;
          padding: 14px 17px;
          border-radius: 16px;
          background: #f1f5f9;
          color: #1e293b;
          line-height: 1.6;
          text-align: left;
          white-space: pre-wrap;
        }

        .messageRow.user .bubble {
          background: #4f46e5;
          color: white;
        }

        .sources {
          margin-top: 8px;
          text-align: left;
        }

        .sourcesTitle {
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 5px;
        }

        .source {
          display: inline-block;
          padding: 4px 8px;
          margin-right: 5px;
          border-radius: 7px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 11px;
        }

        .inputArea {
          display: flex;
          gap: 12px;
          padding: 20px 24px 10px;
          border-top: 1px solid #e5e7eb;
        }

        textarea {
          flex: 1;
          min-height: 58px;
          resize: vertical;
          border: 1px solid #dbe3f0;
          border-radius: 14px;
          padding: 15px;
          font: inherit;
          outline: none;
        }

        textarea:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px #eef2ff;
        }

        .inputArea button {
          align-self: stretch;
          min-width: 110px;
          border: none;
          border-radius: 14px;
          background: #4f46e5;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .inputArea button:hover:not(:disabled) {
          background: #4338ca;
        }

        .inputArea button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .inputHint {
          padding: 0 24px 18px;
          color: #94a3b8;
          font-size: 11px;
        }

        .typing {
          display: flex;
          gap: 4px;
        }

        .typing i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #94a3b8;
          animation: bounce 1s infinite;
        }

        .typing i:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing i:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes bounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
          }

          30% {
            transform: translateY(-4px);
          }
        }

        @media (max-width: 700px) {
          .page {
            padding: 12px;
          }

          .hero {
            padding-top: 40px;
          }

          .hero h1 {
            letter-spacing: -2px;
          }

          .messages {
            padding: 20px;
          }

          .messageContent {
            max-width: 85%;
          }

          .inputArea {
            flex-direction: column;
          }

          .inputArea button {
            min-height: 48px;
          }
        }
      `}</style>
    </main>
  );
}