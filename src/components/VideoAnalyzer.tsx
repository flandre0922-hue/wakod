import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { upload } from '@vercel/blob/client';

interface VideoAnalyzerProps {
  onApplyReference: (text: string) => void;
}

export default function VideoAnalyzer({ onApplyReference }: VideoAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<{ transcript: string; analysis: string } | null>(null);
  const [error, setError] = useState<{ message: string; details?: string; availableModels?: string } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (selectedFile: File) => {
    // Vercel Blob can handle much larger files. 
    // Setting limit to 50MB as requested.
    const LIMIT = 50 * 1024 * 1024; 
    
    if (selectedFile.size > LIMIT) {
      setError({ 
        message: 'ファイルサイズが大きすぎます（最大50MB）。', 
        details: `動画ファイルは50MB以下にする必要があります。\nそれ以上の場合は、動画を短くカットするか、圧縮サイトで縮小してください。` 
      });
      return false;
    }
    
    // Check by extension as well since MIME types can be inconsistent
    const allowedExtensions = ['.mp4', '.mov', '.quicktime', '.m4v', '.webm'];
    const fileName = selectedFile.name.toLowerCase();
    const isVideo = selectedFile.type.startsWith('video/') || 
                    allowedExtensions.some(ext => fileName.endsWith(ext));
                    
    if (!isVideo) {
      setError({ message: '対応している動画ファイル（mp4, mov, webm等）を選択してください。' });
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setStatus('ファイルをアップロード中...');
    setError(null);
    
    try {
      // 1. Upload to Vercel Blob directly from client
      setStatus('クラウドにアップロード中（Vercel Blob）...');
      // Use a unique filename by prepending a timestamp to avoid "blob already exists" error
      const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      const blob = await upload(uniqueFileName, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-video',
      });
      
      console.log('Blob uploaded successfully:', blob.url);

      // 2. Call backend for Gemini analysis
      setStatus('解析中（Gemini 1.5 Pro）...');
      
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: blob.url,
          fileName: file.name,
          fileType: file.type
        }),
      });
      
      console.log('Fetch response received:', response.status);
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: 'サーバーから不正なレスポンスが返りました。', details: text.substring(0, 500) };
      }

      if (!response.ok) {
        setError({ 
          message: data.error || `解析に失敗しました (${response.status})`, 
          details: data.details || '詳細はサーバーログを確認してください。',
          availableModels: data.availableModels
        });
        setIsAnalyzing(false);
        return;
      }
      
      setResult(data.result);
      
    } catch (err: any) {
      console.error('Client-side handleAnalyze error:', err);
      // Capture DOMException details specifically
      setError({
        message: err.message || '予期せぬエラーが発生しました',
        details: `${err.name}: ${err.message}\n${err.stack || ''}`
      });
    } finally {
      setIsAnalyzing(false);
      setStatus('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyResult = () => {
    if (!result?.transcript) return;
    onApplyReference(result.transcript);
    handleReset();
    alert('お手本に反映しました。解析結果をリセットしたので、新しい動画をアップロードできます。');
  };

  const handleCopyNarration = () => {
    if (!result?.transcript) return;
    
    // 【】や[]や()で囲まれた注釈を除去する正規表現
    const cleanText = result.transcript
      .replace(/【[^】]*】/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/（[^）]*）/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/^\s*[-ー]?\s*/gm, '') // 行頭のハイフン等も削除
      .replace(/\n{3,}/g, '\n\n') // 余分な空行を詰める
      .trim();
      
    navigator.clipboard.writeText(cleanText);
    alert('ナレーション（セリフ）のみをコピーしました！');
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold rounded-bl-lg">
        PRO FEATURE
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileVideo className="w-5 h-5 text-violet-500" />
          <h2 className="text-lg font-bold">動画解析（文字起こし特化）</h2>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 flex items-center gap-2"
        >
          <span className="text-xs font-medium">{isCollapsed ? "展開する" : "折りたたむ"}</span>
          <div className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
            <Loader2 className="w-3 h-3 rotate-45" />
          </div>
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            参考動画をアップロードして、AIが一言一句正確な「文字起こし」を行います。
            <br />
            <span className="text-[11px] opacity-70">※反映後は自動でリセットされ、別の動画を解析できるようになります。</span>
          </p>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-600'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">動画ファイルをドラッグ＆ドロップ</p>
              <p className="text-xs text-zinc-500">またはクリックしてファイルを選択 (最大50MBのMP4/MOV等)</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded flex items-center justify-center shrink-0">
                    <FileVideo className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                
                {!isAnalyzing && (
                  <button 
                    onClick={handleReset}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="ファイルを削除"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm mb-4 border border-red-100 dark:border-red-900/30">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="font-bold text-base">{error.message}</span>
                  </div>
                  
                  {/* Diagnostic Box */}
                  <div className="mt-3 bg-white/80 dark:bg-black/40 p-3 rounded border border-red-200 dark:border-red-800 text-[11px] space-y-2">
                    <p className="font-semibold text-zinc-500 uppercase tracking-tighter border-b border-red-100 pb-1">診断レポート</p>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">API接続先:</span>
                      <span className="font-mono">Google AI Studio (v1beta)</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500 shrink-0">有効なモデル:</span>
                      <span className="font-mono text-right break-all text-violet-600 dark:text-violet-400">
                        {error.availableModels || '取得中...'}
                      </span>
                    </div>
                    {error.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-zinc-400 hover:text-zinc-600 transition-colors">技術エラー詳細を表示</summary>
                        <div className="mt-1 p-2 bg-zinc-50 dark:bg-zinc-900 rounded font-mono text-[9px] overflow-auto max-h-32 whitespace-pre">
                          {error.details}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="mt-3 text-[11px] text-zinc-500 leading-relaxed italic">
                    ※429エラー時はクォータ（利用制限）超過、404時は地域制限の可能性があります。
                  </div>
                </div>
              )}
              
              {!result && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {status || '解析中...'}
                    </>
                  ) : (
                    '動画を解析する'
                  )}
                </button>
              )}
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-lg p-5 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">文字起こし結果</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyNarration}
                      className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                    >
                      コピー
                    </button>
                    <button
                      onClick={handleReset}
                      className="text-xs text-red-500 font-semibold hover:underline"
                    >
                      破棄して新規作成
                    </button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed font-mono pr-2">
                  {result.transcript}
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleApplyResult}
                  className="w-full sm:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  お手本（参考）に反映して次へ
                </button>
              </div>
              
              <p className="text-[10px] text-zinc-400 text-center">
                ※クォータ節約のため「文字起こし」に特化した軽量モードで動作しています。
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
