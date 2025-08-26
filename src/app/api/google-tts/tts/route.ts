import { NextRequest, NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const word = searchParams.get('word');
  const lang = searchParams.get('lang') || 'en-US';

  if (!word) {
    return NextResponse.json({ error: 'Missing or invalid word parameter' }, { status: 400 });
  }

  try {
    const [response] = await client.synthesizeSpeech({
      input: { text: word },
      voice: {
        languageCode: lang,
        name: 'en-US-Wavenet-D', // You can customize this
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,
        speakingRate: 0.85,
      },
    });

    if (!response.audioContent) {
      return NextResponse.json({ error: 'No audio content returned from TTS' }, { status: 500 });
    }

    return new NextResponse(Buffer.from(response.audioContent as Uint8Array), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `inline; filename="${word}.mp3"`,
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
  }
}
