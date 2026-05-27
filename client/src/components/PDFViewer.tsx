import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Button } from '@/components/ui/button';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PDFViewerProps {
  url: string;
  title?: string;
  isPaid?: boolean;
  showPageCount?: boolean;
}

export default function PDFViewer({ url, title, isPaid = false, showPageCount = true }: PDFViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Container */}
      <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm relative h-96">
        <Worker workerUrl="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={url}
            defaultScale={1}
            plugins={[defaultLayoutPluginInstance]}
            renderError={() => (
              <div className="p-8 text-center text-red-600">
                <p>Failed to load PDF</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm mt-2 inline-block">
                  Open PDF instead
                </a>
              </div>
            )}
          />
        </Worker>
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
