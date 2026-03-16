import { Copy, Check, FileText } from 'lucide-react';
import { useState } from 'react';

type Props = {
  content: string;
};

export default function GeneratedOutput({ content }: Props) {
  const [copied, setCopied] = useState(false);
  const [cleanCopied, setCleanCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      // 正規表現で （フック） や 【ベネフィット】 などのカッコ書きラベルを除去する
      // 全角半角の () [] {} 【】 『』 「」 に囲まれた数文字のラベルを対象
      const cleanContent = content
        .replace(/^[（(【\[『「].{1,10}[）)\]】』」]\s*\n?/gm, '') // 行頭のラベル
        .replace(/[（(【\[『「].{1,10}[）)\]】』」]/g, '') // 文中のラベル
        .replace(/\n{3,}/g, '\n\n') // 余分な空行を詰める
        .trim();

      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text', error);
    }
  };

  const handleCleanCopy = async () => {
    if (!content) return;
    try {
      // 読み上げ用の「クリーンコピー」処理: 
      // 1. ラベルを除去
      // 2. 「フック解説」や「お手本解説」以降のセクションを除去
      // 3. パターン1等の見出しを除去
      const pureText = content
        .replace(/^[（(【\[『「].{1,10}[）)\]】』」]\s*\n?/gm, '') 
        .replace(/[（(【\[『「].{1,10}[）)\]】』」]/g, '')
        .split(/【フック解説】/)[0]
        .split(/お手本から取り入れたポイントの解説/)[0]
        .replace(/^--- パターン\d+ ---\n?/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      await navigator.clipboard.writeText(pureText);
      setCleanCopied(true);
      setTimeout(() => setCleanCopied(false), 2000);
    } catch (error) {
      console.error('Failed to clean copy text', error);
    }
  };

  return (
    <div className="w-full md:w-1/3 lg:w-[400px] border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-6 flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <FileText className="w-5 h-5 text-indigo-500" />
           <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">生成された原稿</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCleanCopy}
            disabled={!content}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
              cleanCopied
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800'
                : !content
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-transparent cursor-not-allowed'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
            }`}
          >
            {cleanCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {cleanCopied ? 'コピー済' : 'クリーンコピー'}
          </button>
          <button
            onClick={handleCopy}
            disabled={!content}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
              copied
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800'
                : !content
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-transparent cursor-not-allowed'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'コピー済' : '全文コピー'}
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm overflow-y-auto relative">
         {!content ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-3 p-6 text-center">
              <FileText className="w-12 h-12 opacity-20" />
              <p className="text-sm">左側の設定と中央の商品情報を入力し、<br/>生成ボタンを押してください。</p>
            </div>
         ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-zinc-800 dark:text-zinc-300 leading-relaxed">
               {content}
            </div>
         )}
      </div>
    </div>
  );
}
