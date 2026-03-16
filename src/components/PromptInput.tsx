import { ProductDetails } from '../types';
import { PackageSearch, Sparkles, CheckCircle2 } from 'lucide-react';

type Props = {
  product: ProductDetails;
  onChange: (newProduct: ProductDetails) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
};

export default function PromptInput({ product, onChange, onGenerate, isGenerating }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...product,
      [name]: value,
    });
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...(product.benefits || [])];
    newBenefits[index] = value;
    onChange({ ...product, benefits: newBenefits });
  };

  const addBenefit = () => {
    const currentBenefits = product.benefits || [];
    if (currentBenefits.length < 5) {
      onChange({ ...product, benefits: [...currentBenefits, ''] });
    }
  };

  const removeBenefit = (index: number) => {
    const currentBenefits = product.benefits || [];
    const newBenefits = currentBenefits.filter((_, i) => i !== index);
    onChange({ ...product, benefits: newBenefits.length ? newBenefits : [''] });
  };

  const isFormValid = product.name?.trim() !== '' && (product.benefits || []).some(b => typeof b === 'string' && b.trim() !== '');

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-10 h-full overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto space-y-8 mt-4 lg:mt-8">
        
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3 mb-2">
            TikTok爆売れ台本ジェネレーター
            <Sparkles className="text-yellow-500 w-6 h-6 md:w-8 md:h-8" />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 ml-1 text-sm md:text-base">
            商品の魅力を最大化する、ショート動画特化型の台本を瞬時に作成します。
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 lg:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
             <PackageSearch className="w-5 h-5 text-blue-500" />
             <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">今回の商品詳細を入力</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                <span>商品名 <span className="text-red-500 ml-1">*</span></span>
              </label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                placeholder="例: 高保湿美容液 スキンクリア"
                className="w-full p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                <span>商品のメリット（最大5つまで） <span className="text-red-500 ml-1">*</span></span>
                <span className="text-xs text-zinc-400 font-normal">{(product.benefits || []).length}/5</span>
              </label>
              
              <div className="space-y-2">
                {(product.benefits || ['']).map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      rows={2}
                      placeholder={index === 0 ? "例: たった1滴で翌朝の肌がプルプルになり、化粧乗りが劇的に変わる" : "例: オーガニック成分100%で敏感肌でも安心"}
                      className="w-full p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-y"
                    />
                    {(product.benefits || []).length > 1 && (
                      <button 
                        onClick={() => removeBenefit(index)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="削除"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {(product.benefits || []).length < 5 && (
                <button
                  onClick={addBenefit}
                  className="mt-3 text-sm flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  メリットを追加する
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                <span>価格・今だけのオファー</span>
                <span className="text-xs text-zinc-400 font-normal">任意</span>
              </label>
              <input
                type="text"
                name="offer"
                value={product.offer}
                onChange={handleChange}
                placeholder="例: 初回限定で通常4000円が1980円"
                className="w-full p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>
            
            <hr className="border-t border-zinc-100 dark:border-zinc-800 my-4" />
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                <span>参考にする原稿（お手本）</span>
                <span className="text-xs text-zinc-400 font-normal">任意</span>
              </label>
              <textarea
                name="referenceText"
                value={product.referenceText || ''}
                onChange={handleChange}
                rows={4}
                placeholder="例: バズったTikTok動画の台本や、参考にしたい他社の原稿など..."
                className="w-full p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-y text-sm"
              />
            </div>

            {product.referenceText && product.referenceText.trim().length > 0 && (
              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="pt-0.5">
                    <input 
                      type="checkbox" 
                      name="copyStructure" 
                      checked={product.copyStructure || false} 
                      onChange={(e) => onChange({ ...product, copyStructure: e.target.checked })} 
                      className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-zinc-900 dark:border-zinc-700 focus:ring-offset-zinc-950" 
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-200 transition-colors">お手本の構成を完コピする</span>
                    <span className="block text-xs text-indigo-700/70 dark:text-indigo-400 mt-1">
                      ONにすると、お手本の「文章のリズム」「型」「空気感」を完璧に分析・維持したまま、中身だけを今回の商品情報に置き換えます。
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={!isFormValid || isGenerating}
          className={`w-full relative overflow-hidden group flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all ${
            (!isFormValid || isGenerating)
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border outline-none border-zinc-200 dark:border-zinc-700 shadow-none'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transform hover:-translate-y-0.5'
          }`}
        >
          {isGenerating ? (
            <>
               <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
               生成中...
            </>
          ) : (
            <>
               最強の台本を生成する
               <CheckCircle2 className={`w-5 h-5 ${isFormValid ? 'opacity-100' : 'opacity-0'} group-hover:scale-110 transition-transform`} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
