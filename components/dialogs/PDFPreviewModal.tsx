import React, { useState, useEffect } from "react";
import { X, Download, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface PDFPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  blob: Blob;
  filename: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({
  isOpen,
  onClose,
  blob,
  filename,
}) => {
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen, onClose]);

  // Generate PDF blob for preview
  useEffect(() => {
    if (isOpen) {
      const mockPdfGeneration = async () => {
        const url = URL.createObjectURL(blob);
        setPdfBlob(url);
      };

      mockPdfGeneration();
    }
    return () => {
      if (pdfBlob) {
        URL.revokeObjectURL(pdfBlob);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEscape = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleEscape}>
      <DialogContent
        className="bg-transparent border-none text-white shadow-none max-w-5xl max-h-[90vh] w-full h-full p-0 m-0"
        onEscapeKeyDown={onClose}
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>
            <div className="flex gap-2 justify-center items-center">
              <FileText stroke="#FB5555" /> <span>{filename}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* PDF Preview Content */}
        <div className="flex-1 w-full h-full pb-6">
          {pdfBlob && (
            <iframe
              src={pdfBlob}
              className="w-full h-full border-none"
              style={{
                width: "100%",
                height: "calc(85vh - 60px)", // Reduced from 100vh and subtract header height
                minHeight: "0", // Override any min-height constraints
              }}
              title="PDF Preview"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreview;
