import { SplitImagePart } from '../types';

/**
 * Slices an image into a grid of rows x cols.
 * Returns an array of blobs and metadata.
 */
export const sliceImage = async (
  imageSrc: string,
  fileName: string,
  rows: number,
  cols: number,
  onProgress?: (progress: number) => void
): Promise<SplitImagePart[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = async () => {
      try {
        const parts: SplitImagePart[] = [];
        const partWidth = img.naturalWidth / cols;
        const partHeight = img.naturalHeight / rows;
        const totalParts = rows * cols;
        let processedCount = 0;

        // Create a dedicated canvas for slicing
        const canvas = document.createElement('canvas');
        canvas.width = partWidth;
        canvas.height = partHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        const nameBase = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const extension = fileName.split('.').pop() || 'png';
        const mimeType = extension.toLowerCase() === 'jpg' || extension.toLowerCase() === 'jpeg' ? 'image/jpeg' : 'image/png';

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            // Clear canvas
            ctx.clearRect(0, 0, partWidth, partHeight);
            
            // Draw slice
            ctx.drawImage(
              img,
              c * partWidth, // Source X
              r * partHeight, // Source Y
              partWidth, // Source Width
              partHeight, // Source Height
              0, // Dest X
              0, // Dest Y
              partWidth, // Dest Width
              partHeight // Dest Height
            );

            // Convert to blob
            const blob = await new Promise<Blob | null>((resolveBlob) => 
              canvas.toBlob(resolveBlob, mimeType, 0.95)
            );

            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              parts.push({
                id: `${nameBase}_${r}_${c}`,
                blobUrl,
                blob,
                fileName: `${nameBase}_part_${r * cols + c + 1}.${extension}`,
                row: r,
                col: c,
              });
            }

            processedCount++;
            if (onProgress) {
              onProgress(Math.round((processedCount / totalParts) * 100));
            }
          }
        }
        resolve(parts);
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
};