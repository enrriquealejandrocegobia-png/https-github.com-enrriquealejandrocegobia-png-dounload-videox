import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  X, 
  FileVideo, 
  CheckCircle2, 
  Trash2,
  ExternalLink,
  Download
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DownloadItem } from "@/src/types";

interface DownloadManagerProps {
  downloads: DownloadItem[];
  onUpdate: (id: string, updates: Partial<DownloadItem>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function DownloadManager({ downloads, onUpdate, onRemove, onClose }: DownloadManagerProps) {
  useEffect(() => {
    const interval = setInterval(() => {
      downloads.forEach(d => {
        if (d.status === 'downloading' && d.progress < 100) {
          const newProgress = Math.min(100, d.progress + Math.random() * 5);
          onUpdate(d.id, { 
            progress: newProgress,
            status: newProgress === 100 ? 'completed' : 'downloading'
          });
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [downloads, onUpdate]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[60] bg-slate-950 flex flex-col sm:max-w-md sm:mx-auto"
    >
      <header className="p-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Download className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">Downloads</h2>
            <p className="text-xs text-slate-500">{downloads.length} items total</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-900">
          <X className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {downloads.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center opacity-40"
            >
              <FileVideo className="w-12 h-12 mb-4" />
              <p className="text-sm">No downloads yet</p>
            </motion.div>
          ) : (
            downloads.map((dl) => (
              <motion.div
                key={dl.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-slate-900/40 border-slate-800 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-800 rounded-xl shrink-0">
                        <FileVideo className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-bold truncate pr-2">{dl.filename}</h3>
                          <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter ${
                            dl.status === 'completed' ? 'border-green-500/50 text-green-500' : 
                            dl.status === 'paused' ? 'border-amber-500/50 text-amber-500' : 'border-blue-500/50 text-blue-500'
                          }`}>
                            {dl.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-3 truncate">{dl.url}</p>
                        
                        <div className="space-y-2">
                          <Progress value={dl.progress} className="h-1.5 bg-slate-800" indicatorClassName="bg-amber-500" />
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-slate-500">{Math.round(dl.progress)}%</span>
                            <div className="flex gap-1">
                              {dl.status !== 'completed' && (
                                <Button 
                                  size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-slate-800"
                                  onClick={() => onUpdate(dl.id, { status: dl.status === 'paused' ? 'downloading' : 'paused' })}
                                >
                                  {dl.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                              <Button 
                                size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-red-500/10 hover:text-red-500"
                                onClick={() => onRemove(dl.id)}
                              >
                                {dl.status === 'completed' ? <Trash2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              </Button>
                              {dl.status === 'completed' && (
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-blue-500/10 hover:text-blue-500">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </main>

      <footer className="p-4 bg-slate-900/20 border-t border-slate-900">
        <Button onClick={onClose} className="w-full bg-slate-100 text-slate-950 font-bold h-12 rounded-2xl">
          Back to Analyzer
        </Button>
      </footer>
    </motion.div>
  );
}
