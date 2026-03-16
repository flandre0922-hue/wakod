export type AppSettings = {
  category: string;
  target: string;
  tone: string;
  ngRules: string;
  duration: '15' | '30' | '45' | '60';
  includeNarration: boolean;
  includeTelop: boolean;
  includeHookExplanation: boolean;
  includeReferenceExplanation: boolean;
  generationCount: number;
};

export type ProductDetails = {
  name: string;
  benefits: string[];
  offer: string;
  referenceText?: string;
  copyStructure?: boolean;
};

export type AppState = {
  settings: AppSettings;
  product: ProductDetails;
};

export type HistoryEntry = {
  id: string;
  timestamp: string;
  product: ProductDetails;
  settings: AppSettings;
  generatedContent: string;
};

export const defaultSettings: AppSettings = {
  category: 'コスメ',
  target: '20代女性',
  tone: 'テンション高め',
  ngRules: '薬機法に触れる表現（絶対治る等）は禁止\n他社比較NG',
  duration: '30',
  includeNarration: true,
  includeTelop: true,
  includeHookExplanation: false,
  includeReferenceExplanation: false,
  generationCount: 1,
};

export const defaultProduct: ProductDetails = {
  name: '',
  benefits: [''],
  offer: '',
  referenceText: '',
  copyStructure: false,
};
