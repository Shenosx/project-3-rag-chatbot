import formidable from "formidable";
import fs from "fs/promises";
import pdfParse from "pdf-parse";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const config = {
  api: {
    bodyParser: false,
  },
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function parseForm(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { files } = await parseForm(req);

    let uploadedFile = files.file;

    if (Array.isArray(uploadedFile)) {
      uploadedFile = uploadedFile[0];
    }

    if (!uploadedFile) {
      return res.status(400).json({
        error: "No PDF file uploaded",
      });
    }

    const fileName = uploadedFile.originalFilename || "document.pdf";

    const mimeType = uploadedFile.mimetype;

    if (
      mimeType !== "application/pdf" &&
      !fileName.toLowerCase().endsWith(".pdf")
    ) {
      return res.status(400).json({
        error: "Only PDF files are allowed",
      });
    }

    const fileBuffer = await fs.readFile(uploadedFile.filepath);

    const pdf = await pdfParse(fileBuffer);

    const text = pdf.text?.trim();

    if (!text) {
      return res.status(400).json({
        error: "Could not extract text from this PDF",
      });
    }

    const document = await prisma.document.create({
      data: {
        title: fileName,
        content: text,
      },
    });

    return res.status(200).json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        createdAt: document.createdAt,
      },
      pages: pdf.numpages,
      textLength: text.length,
    });
  } catch (error) {
    console.error("PDF upload error:", error);

    return res.status(500).json({
      error: "Failed to upload and process PDF",
    });
  }
}