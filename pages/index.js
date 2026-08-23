import Link from "next/link";

export default function Home() {
  return (
    <>
      <main className="home">
        <nav className="nav">
          <div className="logo">
            <span className="logoIcon">✦</span>
            AI Document Chat
          </div>

          <Link href="/documents" className="navButton">
            Documents
          </Link>
        </nav>

        <section className="hero">
          <div className="badge">✦ AI-Powered Document Assistant</div>

          <h1>
            Chat with your
            <br />
            <span>documents.</span>
          </h1>

          <p>
            Upload a PDF and ask questions using AI-powered semantic search.
            Get accurate answers with source citations from your documents.
          </p>

          <div className="actions">
            <Link href="/documents" className="primary">
              Upload a PDF <span>→</span>
            </Link>

            <Link href="/documents" className="secondary">
              View Documents
            </Link>
          </div>
        </section>

        <section className="features">
          <div className="feature">
            <div className="icon">📄</div>
            <h3>PDF Upload</h3>
            <p>
              Upload your documents and automatically extract their content.
            </p>
          </div>

          <div className="feature">
            <div className="icon">✦</div>
            <h3>AI Search</h3>
            <p>
              Find relevant information using semantic vector search.
            </p>
          </div>

          <div className="feature">
            <div className="icon">⌕</div>
            <h3>Source Citations</h3>
            <p>
              See where each answer comes from in your original document.
            </p>
          </div>
        </section>
      </main>

      <style jsx>{`
        .home {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          padding: 0 28px 70px;
        }

        .nav {
          max-width: 1100px;
          margin: 0 auto;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
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

        .navButton {
          text-decoration: none;
          color: #334155;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 10px;
        }

        .navButton:hover {
          background: #e2e8f0;
        }

        .hero {
          max-width: 850px;
          margin: 90px auto 0;
          text-align: center;
        }

        .badge {
          display: inline-block;
          padding: 8px 14px;
          border-radius: 999px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(52px, 8vw, 82px);
          line-height: 0.98;
          letter-spacing: -0.055em;
        }

        .hero h1 span {
          color: #4f46e5;
        }

        .hero p {
          max-width: 650px;
          margin: 30px auto;
          color: #64748b;
          font-size: 19px;
          line-height: 1.7;
        }

        .actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .actions a {
          text-decoration: none;
          padding: 14px 22px;
          border-radius: 12px;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .primary {
          background: #4f46e5;
          color: white;
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.2);
        }

        .primary:hover {
          background: #4338ca;
          transform: translateY(-2px);
        }

        .secondary {
          background: white;
          color: #334155;
          border: 1px solid #e2e8f0;
        }

        .secondary:hover {
          background: #f1f5f9;
        }

        .features {
          max-width: 1050px;
          margin: 100px auto 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .feature {
          background: white;
          padding: 28px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.04);
        }

        .icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 22px;
          margin-bottom: 18px;
        }

        .feature h3 {
          margin: 0 0 10px;
          font-size: 18px;
        }

        .feature p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
        }

        @media (max-width: 700px) {
          .home {
            padding: 0 18px 50px;
          }

          .hero {
            margin-top: 60px;
          }

          .features {
            grid-template-columns: 1fr;
            margin-top: 60px;
          }

          .hero h1 {
            font-size: 52px;
          }

          .hero p {
            font-size: 17px;
          }
        }
      `}</style>
    </>
  );
}