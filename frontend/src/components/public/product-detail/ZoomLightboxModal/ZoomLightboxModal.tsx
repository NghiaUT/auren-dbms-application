import React from 'react';

export interface ZoomLightboxModalProps {
  zoomImage: string | null;
  onClose: () => void;
}

export const ZoomLightboxModal: React.FC<ZoomLightboxModalProps> = ({
  zoomImage,
  onClose,
}) => {
  if (!zoomImage) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0D0703]/90 flex items-center justify-center p-4 cursor-zoom-out"
    >
      <div className="relative max-w-5xl max-h-[90vh]">
        <img
          src={zoomImage}
          alt="Phóng to"
          className="max-h-[90vh] max-w-full object-contain rounded-[2px]"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#FAF8F3] bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors"
          aria-label="Đóng phóng to"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
