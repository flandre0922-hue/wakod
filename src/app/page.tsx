"use client";

import { useState, useEffect } from 'react';
import SidebarSettings from '@/components/SidebarSettings';
import PromptInput from '@/components/PromptInput';
import VideoAnalyzer from '@/components/VideoAnalyzer';
import GeneratedOutput from '@/components/GeneratedOutput';
import HistoryList from '@/components/HistoryList';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { defaultSettings, defaultProduct, HistoryEntry } from '@/types';

export default function Home() {
  const [settings, setSettings] = useLocalStorage('tiktok-settings', defaultSettings);
  const [product, setProduct] = useLocalStorage('tiktok-product', defaultProduct);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('tiktok-history', []);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 初回マウント確認（hydrationエラー回避用）
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

    const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedContent(''); // 生成開始時にクリア

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings, product }),
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'レスポンスの解析に失敗しました。' };
        }
        throw new Error(errorData.error || errorData.message || `生成に失敗しました (Status: ${response.status})`);
      }
      
      const data = await response.json();
      setGeneratedContent(data.result);

      // 履歴に追加
      const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        product: { ...product },
        settings: { ...settings },
        generatedContent: data.result,
      };
      setHistory([newEntry, ...history]);

    } catch (error: any) {
      console.error('Generation Error:', error);
      // 生成エリアにエラーを表示
      setGeneratedContent(`【エラーが発生しました】\n${error.message}\n\n時間をおいて再度お試しいただくか、設定を見直してください。`);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleRestoreHistory = (entry: HistoryEntry) => {
    setProduct(entry.product);
    setSettings(entry.settings);
    setGeneratedContent(entry.generatedContent);
    // スクロールトップへ戻すなどの処理を追加しても良い
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) {
    return <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">ローディング中...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans w-full">
      <SidebarSettings settings={settings} onChange={setSettings} />
      
      <div className="flex-1 flex flex-col h-full overflow-y-auto w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <VideoAnalyzer onApplyReference={(text: string) => setProduct(prev => ({ ...prev, referenceText: text }))} />
        
        <PromptInput 
          product={product} 
          onChange={setProduct} 
          onGenerate={handleGenerate} 
          isGenerating={isGenerating} 
        />
        <HistoryList history={history} onRestore={handleRestoreHistory} />
      </div>

      <GeneratedOutput content={generatedContent} />
    </div>
  );
}
