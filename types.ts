export interface SplitImagePart {
  id: string;
  blobUrl: string;
  blob: Blob;
  fileName: string;
  row: number;
  col: number;
}

export interface ProcessingItem {
  id: string;
  file: File;
  previewUrl: string;
  rows: number;
  cols: number;
  isProcessing: boolean;
  parts: SplitImagePart[];
  progress: number; // 0 to 100
  error?: string;
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
}

export interface GridConfig {
  rows: number;
  cols: number;
}