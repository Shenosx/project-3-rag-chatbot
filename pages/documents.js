import React, { useState } from "react";
import Link from "next/link";
import PdfUploader from "../components/PdfUploader";

export default function DocumentsPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState(null);

  const handleUpload = async (file) => {
    setLoading(true);
    setMessage("");
    setDocument(null);

    try {
      // 1. Upload PDF
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // 2. Process PDF
      const processResponse = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: data.document.id,
        }),
      });

      const processData = await processResponse.json();

      if (!processResponse.ok) {
        throw new Error(
          processData.error || "Document processing failed"
        );
      }

      // 3. Generate embeddings
      const embedResponse = await fetch("/api/embed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: data.document.id,
        }),
      });

      const embedData = await embedResponse.json();

      if (!embedResponse.ok) {
        throw new Error(
          embedData.error || "Embedding generation failed"
        );
      }

      // Save uploaded document for display
      setDocument(data.document);

      setMessage(
        `Ready — ${embedData.embeddedChunks} chunks embedded successfully.`
      );
    } catch (error) {
      setMessage(error.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <nav className="nav">
        <Link href="/" className="logo">
          <span className="logoIcon">✦</span>
          AI Document Chat
        </Link>

        <Link href="/" className="homeButton">
          ← Home
        </Link>
      </nav>

      <section className="header">
        <div>
          <div className="badge">DOCUMENTS</div>

          <h1>Your Documents</h1>

          <p>
            Upload a PDF, process it with AI, and start chatting with
            your document.
          </p>
        </div>
      </section>

      <section className="uploadCard">
        <div className="uploadIcon">↑</div>

        <h2>Upload a PDF</h2>

        <p>
          Upload your document to extract text, generate embeddings,
          and enable AI-powered questions.
        </p>

        <PdfUploader onUpload={handleUpload} />

        {loading && (
          <div className="status loading">
            <span className="spinner"></span>
            Uploading, processing and generating embeddings...
          </div>
        )}

        {!loading && message && (
          <div className="status success">
            ✓ {message}
          </div>
        )}
      </section>

      {document && (
        <section className="documentsSection">
          <div className="sectionTitle">
            <div>
              <h2>Uploaded Documents</h2>
              <p>Your document is ready to chat with.</p>
            </div>
          </div>

          <div className="documentCard">
            <div className="documentIcon">📄</div>

            <div className="documentInfo">
              <h3>{document.title}</h3>

              <p>
                Document ID: {document.id}
              </p>

              <span className="ready">
                ● Ready for AI chat
              </span>
            </div>

            <Link
              href={`/chat/${document.id}`}
              className="chatButton"
            >
              Chat
              <span>→</span>
            </Link>
          </div>
        </section>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          padding: 0 28px 80px;
        }

        .nav {
          max-width: 1050px;
          height: 76px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0f172a;
          text-decoration: none;
          font-size: 18px;
          font-weight: 700;
        }

        .logoIcon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #4f46e5;
          color: white;
        }

        .homeButton {
          text-decoration: none;
          color: #475569;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 10px;
        }

        .homeButton:hover {
          background: #e2e8f0;
        }

        .header {
          max-width: 1050px;
          margin: 65px auto 35px;
        }

        .badge {
          color: #4f46e5;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.12em;
          margin-bottom: 10px;
        }

        .header h1 {
          margin: 0;
          font-size: 48px;
          letter-spacing: -0.04em;
        }

        .header p {
          margin-top: 14px;
          color: #64748b;
          font-size: 17px;
        }

        .uploadCard {
          max-width: 1050px;
          margin: 0 auto;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 45px;
          text-align: center;
          box-shadow: 0 15px 45px rgba(15, 23, 42, 0.05);
        }

        .uploadIcon {
          width: 58px;
          height: 58px;
          margin: 0 auto 20px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 30px;
          font-weight: 700;
        }

        .uploadCard h2 {
          margin: 0;
          font-size: 25px;
        }

        .uploadCard > p {
          max-width: 550px;
          margin: 12px auto 28px;
          color: #64748b;
          line-height: 1.6;
        }

        .status {
          margin: 25px auto 0;
          padding: 13px 18px;
          border-radius: 12px;
          max-width: 650px;
          font-size: 14px;
          font-weight: 600;
        }

        .success {
          background: #ecfdf5;
          color: #047857;
        }

        .loading {
          background: #eef2ff;
          color: #4338ca;
        }

        .spinner {
          display: inline-block;
          width: 13px;
          height: 13px;
          margin-right: 8px;
          border: 2px solid #c7d2fe;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: -2px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .documentsSection {
          max-width: 1050px;
          margin: 55px auto 0;
        }

        .sectionTitle h2 {
          margin: 0;
          font-size: 25px;
        }

        .sectionTitle p {
          margin: 7px 0 20px;
          color: #64748b;
        }

        .documentCard {
          display: flex;
          align-items: center;
          gap: 18px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.04);
        }

        .documentIcon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          background: #eef2ff;
          border-radius: 13px;
          font-size: 24px;
          flex-shrink: 0;
        }

        .documentInfo {
          flex: 1;
          min-width: 0;
        }

        .documentInfo h3 {
          margin: 0 0 6px;
          font-size: 17px;
          word-break: break-word;
        }

        .documentInfo p {
          margin: 0 0 6px;
          color: #94a3b8;
          font-size: 13px;
        }

        .ready {
          color: #059669;
          font-size: 13px;
          font-weight: 600;
        }

        .chatButton {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 11px;
          background: #4f46e5;
          color: white;
          text-decoration: none;
          font-weight: 700;
          transition: 0.2s ease;
          flex-shrink: 0;
        }

        .chatButton:hover {
          background: #4338ca;
          transform: translateY(-2px);
        }

        @media (max-width: 700px) {
          .page {
            padding: 0 18px 60px;
          }

          .header {
            margin-top: 45px;
          }

          .header h1 {
            font-size: 40px;
          }

          .uploadCard {
            padding: 30px 20px;
          }

          .documentCard {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .chatButton {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </main>
  );
}