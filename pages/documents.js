import React, { useState } from "react";
import PdfUploader from "../components/PdfUploader";

export default function DocumentsPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file) => {
    setLoading(true);
    setMessage("");

    try {
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
        throw new Error(processData.error || "Document processing failed");
      }
      
      setMessage(
        `Uploaded and processed successfully: ${data.document.title} — ${processData.chunkCount} chunks`
      );

      setMessage(
        `Uploaded successfully: ${data.document.title} (ID: ${data.document.id})`
      );
    } catch (error) {
      setMessage(error.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
      <h1>Documents</h1>

      <p>Upload a PDF document to start using the RAG chatbot.</p>

      <PdfUploader onUpload={handleUpload} />

      {loading && <p>Uploading and processing PDF...</p>}

      {message && <p>{message}</p>}
    </main>
  );
}