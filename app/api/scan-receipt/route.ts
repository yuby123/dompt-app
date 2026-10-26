import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

function createNoCacheResponse(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: NO_CACHE_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return createNoCacheResponse({ error: 'Gambar tidak ditemukan' }, 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return createNoCacheResponse(
        { error: 'GEMINI_API_KEY belum dikonfigurasi di lingkungan server' },
        500
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const promptText = `
Analisis bukti transaksi/transfer (SeaBank, BCA, Mandiri, BRI, BNI, Jago, DANA, GoPay, OVO, ShopeePay, QRIS, Struk Kasir):
1. amount: Nominal angka bulat (integer Rupiah) yang dibayarkan/diterima/ditransfer.
2. type: 'expense' (pembayaran/transfer keluar/struk belanja), 'income' (dana masuk/terima transfer), atau 'transfer' (antar rekening sendiri).
3. title: Nama merchant, toko, nama penerima atau pengirim transfer.
4. sourceApp: Nama bank/aplikasi (misal: "SeaBank", "BCA", "DANA", "GoPay", "ShopeePay", "Mandiri", "QRIS", "Indomaret").
5. suggestedCategory: Kategori paling cocok (Makanan, Minuman, Belanja Harian, Transportasi, Tagihan & Langganan, Kesehatan, Hiburan, Top Up, Gaji Pokok, Lainnya).
6. suggestedWallet: Nama dompet/bank yang terdeteksi (misal: "SeaBank", "Rekening Bank", "E-Wallet", "ShopeePay", "BCA", "Tunai").
7. date: Tanggal transaksi YYYY-MM-DD jika tertera.
8. time: Waktu transaksi HH:mm jika tertera.
9. notes: Keterangan singkat atau nomor referensi transaksi.
    `.trim();

    const config = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: {
            type: Type.INTEGER,
            description: 'Nominal transaksi dalam Rupiah (integer bulat)',
          },
          type: {
            type: Type.STRING,
            description: "'expense', 'income', or 'transfer'",
          },
          title: {
            type: Type.STRING,
            description: 'Nama merchant, penerima, pengirim, atau toko',
          },
          sourceApp: {
            type: Type.STRING,
            description: 'Nama bank atau e-wallet asal bukti',
          },
          suggestedCategory: {
            type: Type.STRING,
            description: 'Kategori pengeluaran atau pemasukan yang cocok',
          },
          suggestedWallet: {
            type: Type.STRING,
            description: 'Nama dompet atau bank yang teridentifikasi',
          },
          date: {
            type: Type.STRING,
            description: 'Tanggal transaksi format YYYY-MM-DD',
          },
          time: {
            type: Type.STRING,
            description: 'Waktu transaksi format HH:mm',
          },
          notes: {
            type: Type.STRING,
            description: 'Catatan ringkas atau nomor referensi transaksi',
          },
        },
        required: ['amount', 'type', 'title'],
      },
    };

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-3-flash-preview',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-2.5-flash-lite',
    ];

    let response: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [imagePart, { text: promptText }],
          },
          config,
        });
        if (response?.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || '');
        console.warn(`Scan receipt model ${modelName} failed:`, errMsg);

        // If 503 high demand / overloaded, wait briefly before trying next fallback model
        if (
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.toLowerCase().includes('high demand') ||
          errMsg.includes('429')
        ) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    if (!response?.text) {
      throw lastError || new Error('Tidak ada respons dari model AI');
    }

    const rawText = response.text.trim();
    const cleanedJsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleanedJsonText || '{}');

    return createNoCacheResponse({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Scan receipt error:', err);
    const rawMsg = String(err?.message || err || '');
    let friendlyError = 'Gagal memproses gambar screenshot. Silakan coba lagi.';

    if (
      rawMsg.includes('503') ||
      rawMsg.includes('UNAVAILABLE') ||
      rawMsg.toLowerCase().includes('high demand') ||
      rawMsg.toLowerCase().includes('overloaded')
    ) {
      friendlyError =
        'Server AI sedang sibuk karena lonjakan trafik sementara (Error 503). Silakan klik "Coba lagi".';
    } else if (
      rawMsg.includes('429') ||
      rawMsg.includes('RESOURCE_EXHAUSTED') ||
      rawMsg.toLowerCase().includes('quota')
    ) {
      friendlyError =
        'Batas antrean permintaan AI tercapai sementara (Error 429). Tunggu beberapa detik lalu klik "Coba lagi".';
    } else if (rawMsg && !rawMsg.trim().startsWith('{')) {
      friendlyError = rawMsg;
    }

    return createNoCacheResponse({ error: friendlyError }, 503);
  }
}
