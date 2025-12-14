import React from 'react';

export function PDFPreview({ pdfUrl }) {
    return (
        <div className="h-full w-full bg-gray-100 p-4 flex items-center justify-center">
            {pdfUrl ? (
                <iframe src={pdfUrl} className="w-full h-full shadow-lg rounded-lg" title="Resume Preview" />
            ) : (
                <div className="text-gray-500">No PDF generated yet. Upload a resume or click Generate.</div>
            )}
        </div>
    );
}
