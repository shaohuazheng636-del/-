import React, { useEffect, useMemo } from 'react';
import { ProcessingItem } from '../types';
import { Trash2, Download, Settings2, Grid3X3, Loader2, CheckCircle2 } from 'lucide-react';
import { sliceImage } from '../utils/imageProcessor';
import { generateSingleZip, saveBlob } from '../utils/zipHelper';

interface ImageCardProps {
  item: ProcessingItem;
  onUpdate: (id: string, updates: Partial<ProcessingItem>) => void;
  onRemove: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ item, onUpdate, onRemove }) => {
  
  // Debounce the processing trigger
  useEffect(() => {
    let active = true;
    const process = async () => {
      onUpdate(item.id, { isProcessing: true, progress: 0, parts: [] });
      try {
        const parts = await sliceImage(
          item.previewUrl,
          item.file.name,
          item.rows,
          item.cols,
          (progress) => {
            if (active) onUpdate(item.id, { progress });
          }
        );
        if (active) {
          onUpdate(item.id, { isProcessing: false, parts, progress: 100, error: undefined });
        }
      } catch (err) {
        if (active) {
          console.error(err);
          onUpdate(item.id, { isProcessing: false, error: "Failed to process image" });
        }
      }
    };

    const timer = setTimeout(() => {
        process();
    }, 500); // Debounce to allow user to type grid size quickly

    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.rows, item.cols, item.previewUrl]);


  const handleDownloadZip = async () => {
    if (item.parts.length === 0) return;
    try {
      const blob = await generateSingleZip(item.parts, item.file.name);
      const zipName = item.file.name.replace(/\.[^/.]+$/, "") + "_split.zip";
      saveBlob(blob, zipName);
    } catch (e) {
      console.error("Zip failed", e);
    }
  };

  // Calculate grid lines for visual preview overlay
  const gridOverlay = useMemo(() => {
    const lines = [];
    // Horizontal lines
    for (let i = 1; i < item.rows; i++) {
      lines.push(
        <div 
          key={`h-${i}`} 
          className="absolute w-full border-t border-primary/60 border-dashed pointer-events-none shadow-sm"
          style={{ top: `${(i / item.rows) * 100}%` }}
        />
      );
    }
    // Vertical lines
    for (let i = 1; i < item.cols; i++) {
      lines.push(
        <div 
          key={`v-${i}`} 
          className="absolute h-full border-l border-primary/60 border-dashed pointer-events-none shadow-sm"
          style={{ left: `${(i / item.cols) * 100}%` }}
        />
      );
    }
    return lines;
  }, [item.rows, item.cols]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-slate-700 transition-all group">
      {/* Header */}
      <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 truncate flex-1">
          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
             <Grid3X3 size={16} />
          </div>
          <span className="text-sm font-medium text-slate-300 truncate" title={item.file.name}>
            {item.file.name}
          </span>
        </div>
        <button 
          onClick={() => onRemove(item.id)}
          className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-colors"
          title="Remove"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row h-full">
        {/* Preview Area */}
        <div className="relative w-full sm:w-1/2 aspect-square bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-950 flex items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-slate-800">
           <div className="relative shadow-2xl rounded-sm overflow-hidden max-w-full max-h-full">
             <img src={item.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain block" />
             {/* Grid Overlay */}
             <div className="absolute inset-0 z-10">
               {gridOverlay}
             </div>
           </div>
           
           {/* Status Badge */}
           <div className="absolute bottom-2 right-2">
             {item.isProcessing ? (
               <div className="bg-slate-900/90 backdrop-blur text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-primary/20 shadow-lg">
                 <Loader2 size={12} className="animate-spin" />
                 Processing... {item.progress}%
               </div>
             ) : item.parts.length > 0 ? (
               <div className="bg-emerald-500/10 backdrop-blur text-emerald-400 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20 shadow-lg">
                 <CheckCircle2 size={12} />
                 Ready
               </div>
             ) : null}
           </div>
        </div>

        {/* Controls Area */}
        <div className="p-4 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">
              <Settings2 size={12} />
              Grid Settings
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Rows (Y)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={item.rows}
                  onChange={(e) => onUpdate(item.id, { rows: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Cols (X)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={item.cols}
                  onChange={(e) => onUpdate(item.id, { cols: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Total Pieces:</span>
                <span className="font-mono text-slate-200">{item.rows * item.cols}</span>
              </div>
              <div className="flex justify-between">
                <span>Output Format:</span>
                <span className="font-mono text-slate-200 uppercase">{item.file.type.split('/')[1] || 'PNG'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={item.isProcessing || item.parts.length === 0}
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
              ${item.parts.length > 0 
                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
          >
             <Download size={16} />
             Download ZIP
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;