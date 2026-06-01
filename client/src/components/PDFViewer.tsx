/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { axiosInstance } from "@/api/client";

interface PDFViewerProps {
  url: string;
  title?: string;
}

export default function PDFViewer({
  url,
  title = "document",
}: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("[PDFViewer] useEffect triggered with url:", url);
    mountedRef.current = true;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`[PDF] Loading PDF from: ${url}`);

        // cleanup old blob if exists
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }

        // Fetch PDF with authentication
        console.log("[PDF] Fetching PDF via axios...");
        const response = await axiosInstance.get(url, {
          responseType: "arraybuffer",
        });

        console.log(
          `[PDF] PDF fetched successfully, size: ${response.data.byteLength} bytes`
        );

        if (!mountedRef.current) return;

        // Create blob from response
        const blob = new Blob([response.data], {
          type: "application/pdf",
        });

        console.log(`[PDF] Blob created, size: ${blob.size} bytes`);

        // Create object URL for iframe
        const objectUrl = URL.createObjectURL(blob);
        console.log(`[PDF] Object URL created: ${objectUrl.substring(0, 50)}...`);

        blobUrlRef.current = objectUrl;
        setPdfUrl(objectUrl);
        setLoading(false);
      } catch (err: any) {
        console.error("[PDF] Error loading PDF:", err);
        console.error("[PDF] Error details:", {
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          message: err?.message,
          data: err?.response?.data,
        });

        if (mountedRef.current) {
          const errorMessage =
            err?.response?.data?.message ||
            err?.response?.data?.error?.message ||
            err?.message ||
            "Failed to load PDF";

          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    if (url) {
      loadPdf();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [url]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const downloadPdf = async () => {
    try {
      const response = await axiosInstance.get(url, {
        responseType: "blob",
      });

      const downloadUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${title}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("[PDF] Download failed:", err);
      alert("Failed to download PDF");
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div
              className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full"
              role="status"
            />
          </div>
          <p className="mt-4 text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Failed to load PDF</p>
          <p className="text-red-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg border border-gray-200">
        <div className="text-sm font-medium text-gray-700">
          PDF Viewer
        </div>
        <Button onClick={downloadPdf} size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>

      {/* PDF Viewer Container */}
      <div className="w-full border rounded-lg overflow-hidden bg-white shadow-md">
        {pdfUrl && (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-[600px] md:h-[800px] border-0"
            title="PDF Viewer"
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}
