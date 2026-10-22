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

    let response;
    try {
      // Primary model: gemini-3.1-flash-lite (fastest, minimal thinking latency, highly reliable for OCR)
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: {
          parts: [imagePart, { text: promptText }],
        },
        config,
      });
    } catch (primaryErr) {
      console.warn('gemini-3.1-flash-lite failed, falling back to gemini-3.8-flash:', primaryErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [imagePart, { text: promptText }],
        },
        config,
      });
    }

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return createNoCacheResponse({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Scan receipt error:', err);
    return createNoCacheResponse(
      { error: err?.message || 'Gagal memproses gambar screenshot' },
      500
    );
  }
}
