import { NextResponse } from 'next/server';
import { AppSettings, ProductDetails } from '@/types';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { settings, product }: { settings: AppSettings; product: ProductDetails } = await req.json();

    const isMulti = settings.generationCount > 1;
    const multiInstructions = isMulti ? `
【複数パターンの作成指示】
今回は **${settings.generationCount}パターン** の異なる台本を作成してください。
それぞれの台本で、冒頭の「フック（惹きつけ）」の切り口を意図的に変えてください。（例：パターン1は「悩みへの共感」、パターン2は「衝撃的な事実の提示」、パターン3は「常識の否定」など）
出力は以下の形式で区切って出力してください。
--- パターン1 ---
（台本）
--- パターン2 ---
（台本）
` : '';

    const benefitsText = product.benefits.filter(b => b.trim() !== '').map((b, i) => `メリット${i+1}: ${b}`).join('\n');

    const systemPrompt = `
あなたは視聴者の財布の紐を緩めるプロのセールスライターです。
以下のルールとフレームワークに従って、TikTok（ショート動画）用の台本を作成してください。

【制約事項】
- 次のNGルールを最優先で完全に守ること：
${settings.ngRules}
- 映像指示（「カメラズーム」「画面分割」など）は一切出力しないこと。
- 文字数は、1秒あたり4.5文字のペースとして、動画の長さ「${settings.duration}秒」に収まる最適なボリュームにすること（例: 30秒なら約130〜140文字程度、45秒なら約200文字程度）。
${settings.includeNarration ? '- ナレーション案（話し言葉）を出力すること。' : '- ナレーションは出力しないこと。'}
${settings.includeTelop ? '- 画面に表示するテロップ（強調したい短い言葉）案を出力すること。' : '- テロップ案は出力しないこと。'}
${settings.includeHookExplanation ? '- 台本の作成後、なぜそのフック（冒頭）にしたのか、心理学的・マーケティングな意図を「フック解説」として短く追記すること。' : ''}
${settings.includeReferenceExplanation ? '- 台本の作成後、「お手本から取り入れたポイントの解説」として、お手本から何を学んでどのように構成に生かしたかを短く追記すること。' : ''}

【構成フレームワーク（PREP法またはPASONAの法則をベース）】
${product.referenceText && product.copyStructure ? `
以下の「お手本となる原稿」の構成を完全にコピーして作成してください：
1. まず、お手本原稿の「文章構成の順番」「一文の長さ（リズム）」「視聴者を惹きつけるテクニック」を分析すること。
2. その「型」を崩さず、中身だけを今回の商品の情報に完璧に置き換えた原稿を作成すること。
3. 単なるリライトではなく、お手本の「勢い」や「空気感」を最大限再現すること。

--- お手本となる原稿 ---
${product.referenceText}
------------------------
` : `
1. 冒頭3秒（フック）: 視聴者の悩みへの深い共感、または衝撃的なBefore/Afterの結果から入り、指を止めさせる。
2. 実証パート: 商品がなぜ良いのか、根拠や特徴を絞って伝える。
3. ベネフィット: 商品の「スペック・機能」ではなく、それを使った後の具体的な「生活の変化・未来」を語る。
4. CTA（最後）: 「今のうちに保存して」「プロフからチェック」など、次の具体的行動をはっきり促す。
`}
${multiInstructions}

【今回の条件】
- カテゴリー: ${settings.category}
- ターゲット層: ${settings.target}
- 全体のトンマナ: ${settings.tone}
- 商品名: ${product.name}
- 商品のメリット: 
${benefitsText}
- 価格・限定オファー等: ${product.offer || '特になし'}
${product.referenceText && !product.copyStructure ? `- 参考資料（トーンや内容のインスピレーションとして適宜参考にしてください）:\n${product.referenceText}` : ''}
`;

    const rawApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const apiKey = rawApiKey?.trim();
    
    // APIキーが設定されていない場合はモックデータを返す
    if (!apiKey) {
      console.log("Gemini API Key is not set. Falling back to Mock Mode.");
      
      let mockParts = [];
      for(let i = 1; i <= settings.generationCount; i++) {
        mockParts.push(`--- パターン${i} ---
（フック）
「${product.benefits[0] || 'この悩み、ずっと放置してない？'}」
これ、実は〇〇を変えるだけで解決するんです。

（実証）
それがこの「${product.name || '商品名'}」。
理由はシンプル、〇〇成分が他と全く違うから。

（ベネフィット）
これを使うようになってから、毎朝のルーティンが激変しました。もう、あの頃のストレスには戻れません。
${product.offer ? `しかも今なら ${product.offer}。` : ''}

（CTA）
忘れないうちに今すぐ保存して、プロフのリンクから詳細をチェックしてね！
---`);
      }

      const mockResult = `【APIキー未設定のため、デモテキストを表示しています】
（※APIキーを設定すると、Geminiによる高度な生成が可能になります）

${mockParts.join('\n\n')}
${settings.includeHookExplanation ? '\n【フック解説】\nターゲットের潜在的な痛みを冒頭で突くことで、強烈な共感を呼び起こし、離脱を防ぐ構成にしています。' : ''}
`;
      return NextResponse.json({ result: mockResult });
    }

    // Gemini APIへのリクエスト（REST API）
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || `Gemini APIエラー (Status: ${response.status})`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('AIからの応答が空でした。プロンプトを見直すか、時間をおいて再度お試しください。');
    }

    return NextResponse.json({ result: resultText });

  } catch (error: any) {
    console.error('Generation API Error:', error);
    return NextResponse.json({ 
      error: error.message || '原稿の生成に失敗しました。',
    }, { status: 500 });
  }
}

