import { Document, Page, pdfjs } from 'react-pdf';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

// Set up PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  title?: string;
  isPaid?: boolean;
  showPageCount?: boolean;
}

export default function PDFViewer({ url, title, isPaid = false, showPageCount = true }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePrevPage = () => {
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const handleNextPage = () => {
    if (numPages) {
      setCurrentPage(Math.min(numPages, currentPage + 1));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Toolbar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600">
            Page {currentPage} {numPages ? `of ${numPages}` : '...'}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNextPage}
            disabled={numPages ? currentPage === numPages : false}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <a
          href={url}
          download={`${title || 'document'}.pdf`}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>

      {/* PDF Container */}
      <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm flex justify-center p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          error={
            <div className="p-8 text-center text-red-600">
              <p>Failed to load PDF</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm mt-2 inline-block">
                Open PDF instead
              </a>
            </div>
          }
          loading={<div className="p-8 text-center text-slate-600">Loading PDF...</div>}
        >
          <Page pageNumber={currentPage} width={400} />
        </Document>
      </div>

      {/* Info & Upgrade Message */}
      <div className="space-y-2">
        {showPageCount && (
          <p className="text-sm text-slate-600 text-center">
            📄 Showing page 1 (preview)
          </p>
        )}

        {isPaid && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-900 font-medium mb-3">
              🔒 Upgrade to see all pages
            </p>
            <Button size="sm" variant="default" className="w-full">
              Upgrade to Premium
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
