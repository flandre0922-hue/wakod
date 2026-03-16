import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (
        pathname,
        /* clientPayload */
      ) => {
        // Authenticate users here if needed
        // For now, allow all uploads to a /videos directory
        return {
          allowedContentTypes: ['video/*'],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
            userId: 'anonymous', 
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of completed uploads
        console.log('Blob upload completed:', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // The client will also get this error
    );
  }
}
