import JSZip from 'jszip';
import { ProcessingItem, SplitImagePart } from '../types';

export const generateZip = async (items: ProcessingItem[]): Promise<Blob> => {
  const zip = new JSZip();

  items.forEach((item) => {
    if (item.parts.length === 0) return;

    // If multiple images, create folders for each. If single, put in root.
    const useFolders = items.length > 1;
    
    // Get base name for folder
    const folderName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || 'image';
    const folder = useFolders ? zip.folder(folderName) : zip;

    if (folder) {
      item.parts.forEach((part: SplitImagePart) => {
        folder.file(part.fileName, part.blob);
      });
    }
  });

  return await zip.generateAsync({ type: 'blob' });
};

export const generateSingleZip = async (parts: SplitImagePart[], baseName: string): Promise<Blob> => {
  const zip = new JSZip();
  parts.forEach((part) => {
    zip.file(part.fileName, part.blob);
  });
  return await zip.generateAsync({ type: 'blob' });
};

export const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};