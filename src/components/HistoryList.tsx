import { useState } from 'react';
import { HistoryEntry } from '../types';
import { History, Clock, FileText, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
};

export default function HistoryList({ history, onRestore }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  const displayedHistory = isExpanded ? history : [history[0]];

  return (
    <div className="w-full max-w-4xl mx-auto px-6 pb-12">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div 
          className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900/80 transition-colors group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-500" />
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">生成履歴</h2>
            <span className="ml-2 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
              {history.length}件
            </span>
          </div>
          {history.length > 1 && (
            <div className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors flex items-center gap-2 text-sm font-medium">
              {isExpanded ? (
                <>
                  <span>閉じる</span>
                  <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>展開する</span>
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[400px] overflow-y-auto">
          {displayedHistory.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onRestore(entry)}
              className="w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-start gap-4 group/item"
            >
              <div className="mt-1 bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate pr-4">
                    {entry.product.name || '商品名未入力'}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-zinc-500 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-3 gap-y-1">
                  <span>カテゴリー: {entry.settings.category}</span>
                  <span>/</span>
                  <span className="truncate max-w-[200px]">メリット: {entry.product.benefits.filter(Boolean).join(', ') || '未入力'}</span>
                </div>
              </div>
              <div className="flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity h-12 w-8 text-blue-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
        
        {history.length > 1 && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full py-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-t border-zinc-100 dark:border-zinc-800"
          >
            過去の履歴を表示する（残り{history.length - 1}件）
          </button>
        )}
      </div>
    </div>
  );
}
