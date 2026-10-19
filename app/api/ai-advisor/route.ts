import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, history, contextData } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { text: 'Halo! Saya AI Advisor Dompt. Sistem AI siap membantu konsultasi keuangan dan mencatat transaksi Anda!' },
        { status: 200 }
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

    const systemInstruction = `
Kamu adalah "AI Advisor" dari aplikasi Dompt - asisten penasihat keuangan pribadi yang cerdas, asyik, to-the-point, dan sangat paham gaya hidup finansial modern Indonesia.
Konteks Keuangan Pengguna:
- Total Saldo: ${contextData?.totalBalance || 'Rp 23.367.000'}
- Pemasukan Bulan Ini: ${contextData?.monthlyIncome || 'Rp 10.000.000'}
- Pengeluaran Bulan Ini: ${contextData?.monthlyExpense || 'Rp 3.133.500'}
- Alokasi 50/30/20: Kebutuhan (50%), Keinginan (30%), Tabungan (20%)
- Runway Dana Darurat: ${contextData?.runway || '5.3 Bulan'}

Tugas & Kemampuan Khusus:
1. Menjawab pertanyaan keuangan, memberikan tips hemat, saran investasi, atau roasting pengeluaran jika diminta dengan gaya santai tapi berbobot.
2. JIKA pengguna ingin mencatat transaksi (misal: "catat kopi 25rb pakai gopay", "belanja 375rb bca tgl 1 maret"), kembalikan JSON blok terstruktur di akhir jawaban dalam format:
\`\`\`transaction_json
{
  "type": "expense",
  "amount": 25000,
  "note": "Kopi",
  "category": "Jajan",
  "wallet": "Gopay",
  "date": "2026-03-25"
}
\`\`\`
Sehingga aplikasi Dompt bisa langsung menampilkan kartu tambah transaksi otomatis!
Gunakan bahasa Indonesia yang ramah, santai, dan cerdas.
    `.trim();

    const formattedContents = [
      ...(history || []).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    } catch (primaryErr) {
      console.warn('gemini-3.8-flash error, falling back to gemini-3.1-flash-lite:', primaryErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    }

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('AI Advisor error:', error);
    return NextResponse.json(
      { text: 'Maaf, terjadi kendala saat memproses jawaban. Silakan coba kembali sesaat lagi.' },
      { status: 500 }
    );
  }
}
