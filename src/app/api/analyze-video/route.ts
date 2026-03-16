import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const maxDuration = 60; // Vercel function timeout (if deployed)

export async function POST(req: Request) {
  const rawApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const apiKey = rawApiKey?.trim() || '';

  try {
    const { videoUrl, fileName, fileType } = await req.json();

    if (!apiKey) {
      console.error('API Key is missing in environment variables');
      return NextResponse.json({ 
        error: 'APIキーが設定されていません。VercelのEnvironment Variablesに GEMINI_API_KEY を設定してください。' 
      }, { status: 400 });
    }

    console.log(`Starting video analysis from Blob. Key length: ${apiKey.length}. URL: ${videoUrl}`);

    // Download file from Blob URL to temp local file for Gemini FileManager
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Blobからのファイル取得に失敗しました: ${videoResponse.statusText}`);
    }
    const arrayBuffer = await videoResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = os.tmpdir();
    const tempFileName = `video-${Date.now()}-${fileName || 'upload.mp4'}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    fs.writeFileSync(tempFilePath, buffer);

    // 1. Initialize SDKs
    let fileManager;
    let genAI;
    try {
      fileManager = new GoogleAIFileManager(apiKey);
      genAI = new GoogleGenerativeAI(apiKey);
      
      // DEBUG: List available models to see what this API key can access
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        console.log('Available models for this key:', modelsData.models?.map((m: any) => m.name).join(', '));
      }
    } catch (e: any) {
      throw new Error(`SDK初期化エラー: ${e.message}`);
    }

    // 2. Upload File
    let uploadResult;
    try {
      // Use explicit mime type from client if possible
      const mimeType = fileType || 'video/mp4';
      console.log(`Uploading to Google AI... Mime: ${mimeType}`);
      
      uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: mimeType,
        displayName: "video_analysis_input", 
      });
    } catch (e: any) {
      throw new Error(`ファイルアップロードエラー: ${e.message}`);
    }
    
    // 3. Wait for processing
    let fileState;
    try {
      fileState = await fileManager.getFile(uploadResult.file.name);
      while (fileState.state === "PROCESSING") {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        fileState = await fileManager.getFile(uploadResult.file.name);
      }
      
      if (fileState.state === "FAILED") {
        throw new Error("Google AI side processing failed.");
      }
    } catch (e: any) {
      throw new Error(`ファイル処理待ちエラー: ${e.message}`);
    }
    
    // 4. Smart Model Selection & Generation
    let resultText;
    try {
      // Fetch available models to find a working one
      let selectedModel = "gemini-1.5-flash"; // Fallback default
      try {
        const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          const allModelNames = modelsData.models?.map((m: any) => m.name) || [];
          console.log('Detected available models:', allModelNames.join(', '));
          
          // Selection Priority Logic:
          // We look for partial matches to handle versioned names like "gemini-1.5-flash-latest"
          const findModel = (substring: string) => allModelNames.find((n: string) => n.includes(substring));
          
          const found = findModel("gemini-3.1-flash") || 
                        findModel("gemini-2.5-flash") || 
                        findModel("gemini-2.0-flash") || 
                        findModel("gemini-1.5-flash") || 
                        findModel("gemini-flash-latest");
          
          if (found) {
            selectedModel = found.replace("models/", "");
            console.log(`Smart Selector: Dynamically matched and picked "${selectedModel}"`);
          } else if (allModelNames.length > 0) {
            // If none of our preferred models are found, pick the first available one as a last resort
            selectedModel = allModelNames[0].replace("models/", "");
            console.log(`Smart Selector: No preferred models found. Falling back to first available: "${selectedModel}"`);
          }
        }
      } catch (e) {
        console.warn('Model discovery failed, using default fallback:', e);
      }

      const model = genAI.getGenerativeModel({ model: selectedModel });
      const promptText = `
あなたは動画の文字起こしアシスタントです。
アップロードされた動画を再生し、音声の内容を【一言一句正確に】文字起こししてください。

【指示】
・「あー」「えー」などの言い淀みも含め、一切要約しないでください。
・勝手な言い換えや要約は厳禁です。
・聞こえた内容をそのままテキストとして出力してください。
`;

      const result = await model.generateContent([
        { text: promptText },
        {
          fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
          },
        },
      ]);
      resultText = result.response.text().trim();
    } catch (e: any) {
      throw new Error(`AI解析実行エラー: ${e.message}`);
    }
    
    // Cleanup AI storage and Vercel Blob
    try {
      await fileManager.deleteFile(uploadResult.file.name);
      console.log(`Deleted from Gemini: ${uploadResult.file.name}`);
      
      // Delete from Vercel Blob
      await del(videoUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
      console.log(`Deleted from Vercel Blob: ${videoUrl}`);
    } catch(e) {
      console.error("Failed to cleanup video files:", e)
    }

    return NextResponse.json({ 
      result: {
        transcript: resultText,
        analysis: "構成分析は無効化されています。"
      } 
    });

  } catch (error: any) {
    console.error('Video Analysis Detailed Error:', error);
    
    // Get available models for better debugging suggestions
    let availableModelsText = "取得失敗（キー不備の可能性）";
    if (apiKey) {
      try {
        const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          availableModelsText = modelsData.models?.map((m: any) => m.name.replace('models/', '')).join(', ') || "なし";
        } else {
          availableModelsText = `エラー: ${modelsResponse.status} (キーが不正または無効)`;
        }
      } catch (e) {
        availableModelsText = "接続エラー";
      }
    }

    const errorMessage = error.message || '動画の解析中にエラーが発生しました。';
    return NextResponse.json({ 
      error: errorMessage,
      details: error.stack,
      availableModels: availableModelsText
    }, { status: 500 });
  }
}
