import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Languages, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Info,
  Youtube,
  Film,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DownloadManager } from "@/src/components/DownloadManager";
import { DownloadItem } from "@/src/types";

interface TranslationResult {
  translatedTitle: string;
  translatedDescription: string;
  summary: string;
  downloadAdvice: string;
}

interface ScanResult {
  found: boolean;
  links?: Array<{ label: string; url: string; type: string }>;
  message?: string;
  advice?: string;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("Spanish");
  const [isLoading, setIsLoading] = useState(false);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [showManager, setShowManager] = useState(false);

  const handleTranslate = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    setScan(null);
    try {
      const resp = await fetch("/api/translate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url, targetLanguage: language }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setTranslation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    setTranslation(null);
    try {
      const resp = await fetch("/api/scan-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url }),
      });
      const data = await resp.json();
      setScan(data);
    } catch (err: any) {
      setError("Failed to scan for links.");
    } finally {
      setIsLoading(false);
    }
  };

  const startDownload = (link: { label: string; url: string; type: string }) => {
    const newItem: DownloadItem = {
        id: Math.random().toString(36).substr(2, 9),
        filename: link.label || "Video_" + Date.now(),
        url: link.url,
        progress: 0,
        status: 'downloading',
        timestamp: Date.now()
    };
    setDownloads(prev => [newItem, ...prev]);
    setShowManager(true);
  };

  const updateDownload = (id: string, updates: Partial<DownloadItem>) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const removeDownload = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-20">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-blue-500/5 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <header className="p-6 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-2"
        >
          <div className="p-2 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
            <Zap className="w-6 h-6 text-slate-900 fill-slate-900" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">VideoHub</h1>
        </motion.div>
        <p className="text-slate-400 text-sm">Professional Translation & Extraction</p>
      </header>

      {/* Main Input Area */}
      <main className="flex-1 px-6 space-y-8">
        <section className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> Video URL
            </label>
            <div className="relative group">
              <Input
                placeholder="Paste video or social link..."
                className="bg-slate-900/50 border-slate-800 h-14 pl-4 pr-12 focus:ring-amber-500/50 focus:border-amber-500 transition-all rounded-2xl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {url && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                    </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              disabled={isLoading || !url}
              onClick={handleTranslate}
              className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 font-medium transition-all group"
            >
              <Languages className="mr-2 w-4 h-4 group-hover:text-amber-500 transition-colors" />
              Translate
            </Button>
            <Button 
              disabled={isLoading || !url}
              onClick={handleScan}
              className="h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all group"
            >
              <Download className="mr-2 w-4 h-4" />
              Scan Links
            </Button>
          </div>
        </section>

        {/* Dynamic Results Section */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-500 animate-pulse">Analyzing video source...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"
            >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
            </motion.div>
          ) : translation ? (
            <motion.div 
              key="translation"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter border-amber-500/50 text-amber-500">
                      Translated AI Insight
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-display leading-tight">{translation.translatedTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-400 leading-relaxed italic">
                    "{translation.translatedDescription}"
                  </p>
                  <Separator className="bg-slate-800" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest">
                       <Info className="w-3 h-3" /> Summary
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                        {translation.summary}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-800/30 p-4">
                    <div className="flex items-start gap-3 text-xs text-slate-400">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{translation.downloadAdvice}</span>
                    </div>
                </CardFooter>
              </Card>
            </motion.div>
          ) : scan ? (
            <motion.div 
                key="scan"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <Card className="glass-panel border-amber-500/20 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Film className="w-5 h-5 text-amber-500" />
                            {scan.found ? "Potential Links Found" : "Scanning Result"}
                        </CardTitle>
                        <CardDescription>
                            {scan.message || "We identified the following resources."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {scan.links?.map((link, i) => (
                            <div 
                                key={i}
                                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700"
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">{link.label}</span>
                                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">{link.type}</span>
                                </div>
                                <Button 
                                    size="icon" 
                                    className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950"
                                    onClick={() => startDownload(link)}
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {!scan.found && (
                            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 opacity-60">
                                <p className="text-xs leading-relaxed">
                                    {scan.advice}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-10 text-center space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center relative">
                <Youtube className="w-8 h-8 text-slate-700" />
                <div className="absolute inset-0 border border-slate-800 rounded-full animate-ping opacity-25" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Ready to parse your video content.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="p-10 text-center">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">
          Powered by Gemini 3.5 & Senior Engineering
        </p>
      </footer>

      {/* Floating Manager Button */}
      {downloads.length > 0 && !showManager && (
          <motion.div 
            initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="fixed bottom-24 right-6 z-40"
          >
              <Button 
                onClick={() => setShowManager(true)}
                className="w-14 h-14 rounded-full bg-amber-500 shadow-xl shadow-amber-500/30 flex items-center justify-center relative"
              >
                  <Download className="w-6 h-6 text-slate-950" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-950 text-amber-500 text-[10px] font-bold rounded-full border border-amber-500/20 flex items-center justify-center">
                    {downloads.filter(d => d.status !== 'completed').length || downloads.length}
                  </span>
              </Button>
          </motion.div>
      )}

      {/* Download Manager Overlay */}
      <AnimatePresence>
        {showManager && (
            <DownloadManager 
                downloads={downloads} 
                onUpdate={updateDownload} 
                onRemove={removeDownload}
                onClose={() => setShowManager(false)}
            />
        )}
      </AnimatePresence>

      {/* Fixed Language Selector (Mobile Nav style) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-900 z-50">
        <div className="flex justify-between items-center max-w-sm mx-auto">
            <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-sm font-bold text-amber-500 focus:outline-none"
            >
                <option value="Spanish">Español</option>
                <option value="English">English</option>
                <option value="German">Deutsch</option>
                <option value="French">Français</option>
                <option value="Portuguese">Português</option>
            </select>
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Info className="w-4 h-4 text-slate-500" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

