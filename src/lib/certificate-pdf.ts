import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export type CertificatePdfData = {
  fullName: string;
  level: string;
  courseTitle?: string | null;
  score?: number | null;
  issuedAt: string; // ISO
  verificationCode: string;
  signature: string;
  verifyUrl: string;
};

export async function generateCertificatePdf(data: CertificatePdfData): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(253, 249, 240);
  doc.rect(0, 0, W, H, "F");

  // Outer border
  doc.setDrawColor(190, 90, 60);
  doc.setLineWidth(4);
  doc.rect(24, 24, W - 48, H - 48);
  doc.setLineWidth(1);
  doc.rect(34, 34, W - 68, H - 68);

  // Header
  doc.setFont("helvetica", "bold");
  doc.setTextColor(190, 90, 60);
  doc.setFontSize(14);
  doc.text("LEARNING ENGLISH WITH COACH", W / 2, 80, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text("OFFICIAL CEFR CERTIFICATE", W / 2, 96, { align: "center" });

  // Title
  doc.setFont("times", "italic");
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(22);
  doc.text("Certificate of Achievement", W / 2, 150, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text("This certifies that", W / 2, 190, { align: "center" });

  // Name
  doc.setFont("times", "bold");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(38);
  doc.text(data.fullName || "Student", W / 2, 240, { align: "center" });

  // Underline
  doc.setDrawColor(190, 90, 60);
  doc.setLineWidth(1);
  doc.line(W / 2 - 180, 254, W / 2 + 180, 254);

  // Level line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  doc.text("has successfully completed the CEFR level", W / 2, 285, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(190, 90, 60);
  doc.setFontSize(64);
  doc.text(data.level, W / 2, 355, { align: "center" });

  if (data.courseTitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(data.courseTitle, W / 2, 380, { align: "center" });
  }

  // Meta row
  const metaY = 430;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "bold");
  doc.text("DATE", 100, metaY);
  doc.text("SCORE", W / 2, metaY, { align: "center" });
  doc.text("CERTIFICATE ID", W - 100, metaY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  const date = new Date(data.issuedAt).toLocaleDateString();
  doc.text(date, 100, metaY + 18);
  doc.text(data.score != null ? `${Math.round(Number(data.score))}%` : "—", W / 2, metaY + 18, {
    align: "center",
  });
  doc.text(data.verificationCode, W - 100, metaY + 18, { align: "right" });

  // Signature
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.6);
  doc.line(90, H - 90, 260, H - 90);
  doc.setFont("times", "italic");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Coach EDU", 175, H - 96, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("DIRECTOR OF EDUCATION", 175, H - 76, { align: "center" });

  // QR Code
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 240 });
  const qrSize = 90;
  doc.addImage(qrDataUrl, "PNG", W - 90 - qrSize, H - 90 - qrSize + 10, qrSize, qrSize);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("Scan to verify", W - 90 - qrSize / 2, H - 76, { align: "center" });

  // Digital signature hash
  doc.setFontSize(6);
  doc.setTextColor(160, 160, 160);
  doc.text(`Digital signature: ${data.signature.slice(0, 48)}…`, W / 2, H - 44, {
    align: "center",
  });

  return doc.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
