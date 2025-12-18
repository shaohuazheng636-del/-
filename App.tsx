import React, { useState, useCallback } from 'react';
import { ProcessingItem } from './types';
import UploadArea from './components/UploadArea';
import ImageCard from './components/ImageCard';
import { generateZip, saveBlob } from './utils/zipHelper';
import { LayoutGrid, List, Layers, Download, Trash2, Github, AlertCircle } from 'lucide-react';

// Fallback ID generator just in case:
const generateId = () => Math.random().toString(36).substring(2, 15);


const App: React.FC = () => {
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [globalRows, setGlobalRows] = useState(3);
  const [globalCols, setGlobalCols] = useState(3);
  const [isZipping, setIsZipping] = useState(false);

  // Add new files to the list
  const handleFilesSelected = useCallback((files: File[]) => {
    const newItems: ProcessingItem[] = files.map(file => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      rows: globalRows,
      cols: globalCols,
      isProcessing: false,
      parts: [],
      progress: 0,
    }));
    setItems(prev => [...prev, ...newItems]);
  }, [globalRows, globalCols]);

  // Update specific item state
  const handleUpdateItem = useCallback((id: string, updates: Partial<ProcessingItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  // Remove item and cleanup URL
  const handleRemoveItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  // Clear all
  const handleClearAll = useCallback(() => {
    items.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
  }, [items]);

  // Apply global rows/cols to all active items
  const applyGlobalSettings = useCallback(() => {
    setItems(prev => prev.map(item => ({
      ...item,
      rows: globalRows,
      cols: globalCols,
    })));
  }, [globalRows, globalCols]);

  // Download all as one mega zip
  const handleDownloadAll = async () => {
    const readyItems = items.filter(i => i.parts.length > 0);
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const blob = await generateZip(readyItems);
      saveBlob(blob, "split_images_batch.zip");
    } catch (e) {
      console.error("Batch zip failed", e);
      alert("Failed to create batch zip.");
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = items.filter(i => i.parts.length > 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-primary to-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <LayoutGrid size={20} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                GridSplitter
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Upload Section */}
        <section className="animate-fade-in-up">
           <UploadArea onFilesSelected={handleFilesSelected} />
        </section>

        {/* Global Controls & List */}
        {items.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Control Bar */}
            <div className="sticky top-20 z-40 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  <Layers size={16} />
                  <span>Global Settings:</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-1 border border-slate-800">
                     <span className="text-xs text-slate-500 px-2">Y</span>
                     <input 
                        type="number" min="1" max="20"
                        value={globalRows}
                        onChange={(e) => setGlobalRows(parseInt(e.target.value) || 1)}
                        className="w-12 bg-transparent text-center text-sm focus:outline-none"
                     />
                     <span className="text-slate-600">×</span>
                     <span className="text-xs text-slate-500 px-2">X</span>
                     <input 
                        type="number" min="1" max="20"
                        value={globalCols}
                        onChange={(e) => setGlobalCols(parseInt(e.target.value) || 1)}
                        className="w-12 bg-transparent text-center text-sm focus:outline-none"
                     />
                   </div>
                   <button 
                     onClick={applyGlobalSettings}
                     className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                   >
                     Apply to All
                   </button>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                 <button 
                    onClick={handleClearAll}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20 hover:border-red-900/50 border border-transparent transition-all"
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                 <button 
                    onClick={handleDownloadAll}
                    disabled={completedCount === 0 || isZipping}
                    className={`
                      flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold shadow-lg transition-all
                      ${completedCount > 0 
                        ? 'bg-gradient-to-r from-primary to-indigo-600 text-white hover:shadow-primary/25 hover:scale-105' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                    `}
                  >
                    {isZipping ? (
                      <span className="animate-pulse">Zipping...</span>
                    ) : (
                      <>
                        <Download size={18} />
                        Download All ({completedCount})
                      </>
                    )}
                  </button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                <ImageCard 
                  key={item.id} 
                  item={item} 
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-12 opacity-50">
             <div className="inline-block p-4 rounded-full bg-slate-900 mb-4">
               <AlertCircle size={48} className="text-slate-700" />
             </div>
             <p className="text-slate-500">No images selected yet.</p>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;