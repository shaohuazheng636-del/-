import React, { useCallback, useRef, useState } from 'react';
import { Upload, Image as ImageIcon, FileImage } from 'lucide-react';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter((file: File) => 
        file.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles);
      }
    }
  }, [onFilesSelected]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const imageFiles = Array.from(e.target.files).filter((file: File) => 
        file.type.startsWith('image/')
      );
      onFilesSelected(imageFiles);
    }
  }, [onFilesSelected]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        flex flex-col items-center justify-center 
        w-full h-64 rounded-2xl border-2 border-dashed 
        transition-all duration-300 ease-out
        ${isDragging 
          ? 'border-primary bg-primary/10 scale-[1.01]' 
          : 'border-slate-700 hover:border-primary/50 hover:bg-slate-800/50 bg-slate-900/50'
        }
      `}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl pointer-events-none" />

      <div className="z-10 flex flex-col items-center space-y-4 text-center p-6">
        <div className={`
          p-4 rounded-full transition-colors duration-300
          ${isDragging ? 'bg-primary text-white' : 'bg-slate-800 text-primary group-hover:bg-primary group-hover:text-white'}
        `}>
          <Upload size={32} strokeWidth={2} />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-slate-200 mb-1">
            Upload Images
          </h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Drag & drop images here, or click to browse.
            Supports JPG, PNG, WEBP.
          </p>
        </div>

        <div className="flex gap-2 text-xs text-slate-500 font-mono bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="flex items-center gap-1"><FileImage size={12}/> Multiple Files</span>
          <span className="w-px h-3 bg-slate-700 self-center"></span>
          <span className="flex items-center gap-1"><ImageIcon size={12}/> High Quality</span>
        </div>
      </div>
    </div>
  );
};

export default UploadArea;