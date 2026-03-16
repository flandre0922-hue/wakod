import { AppSettings } from '../types';
import { Settings, SlidersHorizontal, AlertCircle, Clock } from 'lucide-react';

type Props = {
  settings: AppSettings;
  onChange: (newSettings: AppSettings) => void;
};

export default function SidebarSettings({ settings, onChange }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    onChange({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="w-full flex-none md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 overflow-y-auto flex flex-col gap-6 h-full">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-zinc-500" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">設定パネル</h2>
      </div>

      <div className="space-y-4">
        {/* 基本情報 */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <SlidersHorizontal className="w-4 h-4" />
            基本情報
          </h3>
          <div>
             <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">カテゴリー</label>
             <input type="text" name="category" value={settings.category} onChange={handleChange} placeholder="例: コスメ、ガジェット" className="w-full text-sm p-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
          </div>
          <div>
             <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">ターゲット層</label>
             <input type="text" name="target" value={settings.target} onChange={handleChange} placeholder="例: 20代美容好き女性" className="w-full text-sm p-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
          </div>
          <div>
             <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">トンマナ（雰囲気）</label>
             <select name="tone" value={settings.tone} onChange={handleChange} className="w-full text-sm p-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
               <option value="テンション高め">テンション高め</option>
               <option value="落ち着いたレビュー風">落ち着いたレビュー風</option>
               <option value="お悩み解決型">お悩み解決型</option>
               <option value="プロフェッショナル解説">プロフェッショナル解説</option>
             </select>
          </div>
        </section>

        <hr className="border-t border-zinc-200 dark:border-zinc-800" />

        {/* NGルール */}
        <section className="space-y-3">
           <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <AlertCircle className="w-4 h-4" />
            NGルール設定
          </h3>
          <textarea name="ngRules" value={settings.ngRules} onChange={handleChange} rows={4} placeholder="絶対に使ってはいけない言葉や表現など" className="w-full text-sm p-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-y" />
        </section>

        <hr className="border-t border-zinc-200 dark:border-zinc-800" />

        {/* 出力設定 */}
        <section className="space-y-3 pb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Clock className="w-4 h-4" />
            出力設定
          </h3>
          
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">読み上げ時間目安</label>
            <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-md p-1 border border-zinc-200 dark:border-zinc-800">
              {['15', '30', '45', '60'].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => onChange({ ...settings, duration: time as any })}
                  className={`flex-1 text-xs py-1.5 rounded-sm transition-colors ${settings.duration === time ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  {time}秒
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">生成本数</label>
             <select name="generationCount" value={settings.generationCount || 1} onChange={(e) => onChange({ ...settings, generationCount: parseInt(e.target.value, 10) })} className="w-full text-sm p-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
               {[1, 2, 3, 4, 5].map((num) => (
                 <option key={num} value={num}>{num}本</option>
               ))}
             </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" name="includeNarration" checked={settings.includeNarration} onChange={handleChange} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 focus:ring-offset-zinc-950" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">ナレーション案</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" name="includeTelop" checked={settings.includeTelop} onChange={handleChange} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 focus:ring-offset-zinc-950" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">テロップ案</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" name="includeHookExplanation" checked={settings.includeHookExplanation} onChange={handleChange} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 focus:ring-offset-zinc-950" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">心理的フックの解説</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group mt-1">
              <input type="checkbox" name="includeReferenceExplanation" checked={settings.includeReferenceExplanation ?? false} onChange={handleChange} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 focus:ring-offset-zinc-950" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">お手本から取り入れたポイントの解説</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
