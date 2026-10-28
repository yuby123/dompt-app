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
Analisis screenshot bukti transaksi/transfer dari HP Android (khususnya SeaBank, BCA / myBCA, Mandiri Livin', BRI BRImo, BNI Wondr, Bank Jago, Blu, DANA, GoPay, OVO, ShopeePay, QRIS, atau Struk Kasir):
1. amount: Nominal angka bulat (integer Rupiah tanpa titik/desimal, contoh Rp 50.000 menjadi 50000) yang dibayarkan/ditransfer/diterima. Jika ada biaya admin terpisah, ambil total yang didebet atau nominal utamanya.
2. type:
   - Gunakan 'expense' untuk semua pembayaran QRIS, belanja, top-up e-wallet, pembayaran tagihan, atau transfer keluar dari SeaBank/bank pengguna ke pihak lain ("Transaksi Berhasil", "Transfer Berhasil", "Pembayaran Berhasil").
   - Gunakan 'income' HANYA jika jelas-jelas tertulis dana masuk / menerima uang ke rekening pengguna.
   - Gunakan 'transfer' hanya jika jelas pindah dana antar dompet milik pengguna sendiri.
3. title: Nama penerima transfer, merchant QRIS, tujuan top-up, atau toko (contoh: "Transfer SeaBank ke Budi", "Top Up ShopeePay", "QRIS Warung Makan").
4. sourceApp: Nama bank/aplikasi asal screenshot (contoh: "SeaBank", "BCA", "DANA", "GoPay", "ShopeePay", "Mandiri", "QRIS").
5. suggestedCategory: Kategori paling cocok (Makanan, Minuman, Belanja Harian, Transportasi, Tagihan & Langganan, Kesehatan, Hiburan, Top Up, Gaji Pokok, Lainnya).
6. suggestedWallet: Nama dompet/bank yang terdeteksi dari bukti (contoh: "SeaBank", "Rekening Bank", "E-Wallet", "ShopeePay", "BCA", "Tunai").
7. date: Tanggal transaksi YYYY-MM-DD jika tertera.
8. time: Waktu transaksi HH:mm jika tertera.
9. notes: Ringkasan jelas transaksi (contoh: "SeaBank - Transfer ke Budi Santoso").
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
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
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

        // If 503 high demand / overloaded, wait briefly before trying next fallback model
        if (
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.toLowerCase().includes('high demand') ||
          errMsg.includes('429')
        ) {
          await new Promise((r) => setTimeout(r, 500));
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
