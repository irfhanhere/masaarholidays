import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures an HTML element and saves it as a clean, high-resolution A4 PDF
 * directly to the user's Downloads folder without prompting a print dialog.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = pdfWidth / imgWidth;
  const totalPdfHeight = imgHeight * ratio;

  let heightLeft = totalPdfHeight;
  let position = 0;

  pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, totalPdfHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 5) {
    position = heightLeft - totalPdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pdfHeight;
  }

  const finalName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(finalName);
}
