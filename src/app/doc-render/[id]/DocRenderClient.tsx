"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { downloadElementAsPdf } from "@/lib/documents/client-download-pdf";

export function DocRenderClient({
  children,
  documentNumber,
  autoPrint,
  autoDownload,
}: {
  children: ReactNode;
  documentNumber: string;
  autoPrint: boolean;
  autoDownload: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  async function handleDownload() {
    if (!containerRef.current || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      await downloadElementAsPdf(containerRef.current, `${documentNumber}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("PDF download error:", err);
      // Fallback to native print dialog if canvas capture fails
      window.print();
    } finally {
      setIsDownloading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        handleDownload();
      }, 700);
      return () => clearTimeout(timer);
    } else if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, autoPrint]);

  return (
    <div className="min-h-screen bg-[#F5F2EB] py-6 print:bg-white print:p-0">
      {/* Strict Print Color Adjust styles to ensure background graphics and colors are 100% preserved */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `,
      }} />

      {/* Top Floating Action Bar (hidden when printing) */}
      <div className="no-print mx-auto mb-6 flex max-w-[820px] items-center justify-between rounded-xl border border-black/10 bg-white px-5 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-bold text-masaar-black">
            {documentNumber}
          </span>
          {downloadSuccess && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 animate-in fade-in">
              ✓ PDF Downloaded!
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#b37e28] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#96681f] transition-all disabled:opacity-60 cursor-pointer"
          >
            <span>📥</span> {isDownloading ? "Generating PDF..." : "Download PDF File"}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.03] transition-all cursor-pointer"
          >
            <span>🖨️</span> Print / Save Dialog
          </button>
        </div>
      </div>

      {/* Document Target Container */}
      <div
        ref={containerRef}
        id="document-print-target"
        className="mx-auto max-w-[820px] bg-white shadow-xl print:m-0 print:max-w-none print:shadow-none"
        style={{
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {children}
      </div>
    </div>
  );
}
