export type DownloadStatus = 'downloading' | 'paused' | 'completed' | 'error';

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  progress: number; // 0 to 100
  status: DownloadStatus;
  size?: string;
  timestamp: number;
}
