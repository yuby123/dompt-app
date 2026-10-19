import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

function parseNaturalLanguageTransaction(message: string, availableWallets: string[], availableCategories: string[]) {
  const lower = message.toLowerCase();

  // Check if message looks like recording a transaction
  const txKeywords = [
    'catat',
    'beli',
    'belanja',
    'bayar',
    'makan',
    'jajan',
    'ngopi',
    'kopi',
    'bensin',
    'parkir',
    'transfer',
    'gaji',
    'terima',
    'masuk',
    'topup',
    'top up',
    'tagihan',
    'listrik',
    'wifi',
    'kuota',
    'pakai',
    'pake',
    'via',
  ];
  const hasKeyword = txKeywords.some((k) => lower.includes(k));

  // Match nominal like 375rb, 25k, 1.5jt, 50.000, 50000
  const amountRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(jt|juta|rb|ribu|k)?\b/gi;
  let detectedAmount = 0;
  let matchedAmountRaw = '';

  let match;
  while ((match = amountRegex.exec(lower)) !== null) {
    const fullMatch = match[0];
    const numPart = match[1];
    const unit = match[2];

    // Skip if it looks like a year (2024-2030) or date day (1-31) without unit and < 100
    const cleanVal = parseFloat(numPart.replace(/\./g, '').replace(',', '.'));
    if (!unit && cleanVal >= 2020 && cleanVal <= 2035) continue;
    if (!unit && cleanVal < 500 && !numPart.includes('.')) continue;

    if (unit === 'jt' || unit === 'juta') {
      const val = parseFloat(numPart.replace(',', '.')) * 1_000_000;
      detectedAmount = Math.round(val);
      matchedAmountRaw = fullMatch;
      break;
    } else if (unit === 'rb' || unit === 'ribu' || unit === 'k') {
      const val = parseFloat(numPart.replace(',', '.')) * 1_000;
      detectedAmount = Math.round(val);
      matchedAmountRaw = fullMatch;
      break;
    } else {
      const val = parseInt(numPart.replace(/[.,]/g, ''), 10);
      if (val >= 500) {
        detectedAmount = val;
        matchedAmountRaw = fullMatch;
        break;
      }
    }
  }

  if (!hasKeyword || detectedAmount <= 0) {
    return null;
  }

  const isIncome =
    lower.includes('gaji') ||
    lower.includes('pemasukan') ||
    lower.includes('terima') ||
    lower.includes('bonus') ||
    lower.includes('thr') ||
    lower.includes('cuan');

  // Detect wallet
  let matchedWallet = availableWallets.find((w) => lower.includes(w.toLowerCase())) || '';
  if (!matchedWallet) {
    if (lower.includes('bca')) matchedWallet = 'BCA';
    else if (lower.includes('mandiri')) matchedWallet = 'Mandiri';
    else if (lower.includes('seabank')) matchedWallet = 'SeaBank';
    else if (lower.includes('gopay')) matchedWallet = 'GoPay';
    else if (lower.includes('dana')) matchedWallet = 'DANA';
    else if (lower.includes('ovo')) matchedWallet = 'OVO';
    else if (lower.includes('shopeepay')) matchedWallet = 'ShopeePay';
    else matchedWallet = availableWallets[0] || 'Tunai';
  }

  // Detect category
  let matchedCategory = availableCategories.find((c) => lower.includes(c.toLowerCase())) || '';
  if (!matchedCategory) {
    if (isIncome) matchedCategory = 'Gaji';
    else if (lower.includes('makan') || lower.includes('sarapan') || lower.includes('bahan makanan')) matchedCategory = 'Makan';
    else if (lower.includes('kopi') || lower.includes('ngopi') || lower.includes('jajan') || lower.includes('cemilan')) matchedCategory = 'Jajan';
    else if (lower.includes('bensin') || lower.includes('ojol') || lower.includes('parkir') || lower.includes('transport')) matchedCategory = 'Transportasi';
    else if (lower.includes('listrik') || lower.includes('pln')) matchedCategory = 'Listrik';
    else if (lower.includes('belanja')) matchedCategory = 'Belanja Online';
    else matchedCategory = 'Makan';
  }

  // Detect date if mentioned (e.g. "tgl 1 maret 2026")
  const monthsMap: Record<string, string> = {
    januari: '01',
    februari: '02',
    maret: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    agustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12',
  };
  let dateStr = new Date().toISOString().split('T')[0];
  const dateMatch = lower.match(/(?:tgl|tanggal)?\s*(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)(?:\s+(\d{4}))?/i);
  if (dateMatch) {
    const day = String(dateMatch[1]).padStart(2, '0');
    const month = monthsMap[dateMatch[2].toLowerCase()] || '01';
    const year = dateMatch[3] || String(new Date().getFullYear());
    dateStr = `${year}-${month}-${day}`;
  }

  // Build clean note
  const cleanNote = message
    .replace(/^catat\s+/i, '')
    .replace(matchedAmountRaw, '')
    .replace(/\b(pakai|pake|via|dengan)\s+\w+/gi, '')
    .replace(/\b(tgl|tanggal)\s*\d{1,2}\s+\w+(\s+\d{4})?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    type: isIncome ? 'income' : 'expense',
    amount: detectedAmount,
    note: cleanNote ? cleanNote.charAt(0).toUpperCase() + cleanNote.slice(1) : 'Transaksi Baru',
    category: matchedCategory,
    wallet: matchedWallet,
    date: dateStr,
  };
}

function buildFallbackResponse(message: string, contextData: any): string {
  const walletsList: string[] = contextData?.wallets || ['Tunai', 'Rekening Bank', 'E-Wallet'];
  const categoriesList: string[] = contextData?.categories || ['Makan', 'Jajan', 'Transportasi', 'Belanja Online', 'Listrik', 'Gaji'];

  const parsedTx = parseNaturalLanguageTransaction(message, walletsList, categoriesList);
  if (parsedTx) {
    return `Siap! Aku sudah menyiapkan kartu catatan transaksimu di bawah ini. Klik **Catat Sekarang** untuk menyimpannya ke dompet **${parsedTx.wallet}**:\n\n\`\`\`transaction_json\n${JSON.stringify(parsedTx, null, 2)}\n\`\`\``;
  }

  const lower = message.toLowerCase();
  const totalBalance = contextData?.totalBalance || 'Rp 0';
  const monthlyIncome = contextData?.monthlyIncome || 'Rp 0';
  const monthlyExpense = contextData?.monthlyExpense || 'Rp 0';
  const runway = contextData?.runway || '0 Bulan';

  if (lower.includes('roasting')) {
    return `🔥 **Mode Roasting Keuangan Aktif!**\n\nMari kita lihat datamu bulan ini:\n• **Total Saldo:** ${totalBalance}\n• **Pemasukan Bulan Ini:** ${monthlyIncome}\n• **Pengeluaran Bulan Ini:** ${monthlyExpense}\n• **Runway Dana Darurat:** ${runway}\n\nKalau pengeluaranmu masih sering bocor di *jajan impulsif*, *ngopi cantik*, atau *checkout tengah malam*, jangan heran kalau tabungan jalan di tempat! Yuk disiplin pakai aturan **50/30/20** dan kunci tabunganmu di menu **Goals** supaya nggak gampang kepakai.`;
  }

  if (lower.includes('hp') || lower.includes('beli')) {
    return `📱 **Evaluasi Kemampuan Beli Barang Baru:**\n\nSaat ini posisi keuanganmu:\n• **Total Saldo Aktif:** ${totalBalance}\n• **Pemasukan Bulan Ini:** ${monthlyIncome}\n• **Pengeluaran Bulan Ini:** ${monthlyExpense}\n• **Runway Dana Darurat:** ${runway}\n\n**Saran AI Advisor:**\n1. Pastikan **Dana Darurat minimal 3–6 bulan** tetap aman dan tidak terganggu.\n2. Hindari mencicil gadget konsumtif jika cicilan bulanan melebihi **10% dari pemasukan bulanan**.\n3. Buat **Goal Tabungan** khusus di menu *Goals* agar pembelian dilakukan secara tunai tanpa mengganggu arus kas harian!`;
  }

  if (lower.includes('analisis') || lower.includes('gaya hidup') || lower.includes('evaluasi')) {
    return `📊 **Analisis Kesehatan & Gaya Hidup Finansial Bulan Ini:**\n\n• **Total Saldo Likuid:** ${totalBalance}\n• **Arus Kas Masuk:** ${monthlyIncome}\n• **Arus Kas Keluar:** ${monthlyExpense}\n• **Ketahanan Dana Darurat:** ${runway}\n\n**Rekomendasi Langkah Selanjutnya:**\n1. Cek menu **Skor Sehat** di Dashboard untuk melihat nilai kesehatan finansialmu (0–100).\n2. Daftarkan tagihan bulanan tetap di menu **Langganan** agar tidak ada denda keterlambatan.\n3. Kamu juga bisa langsung ketik di sini misalnya: *"Catat makan siang 35rb pakai Tunai"* untuk mencatat transaksi otomatis!`;
  }

  return `Halo! Berikut ringkasan kondisi keuanganmu saat ini:\n• **Total Saldo:** ${totalBalance}\n• **Pemasukan Bulan Ini:** ${monthlyIncome}\n• **Pengeluaran Bulan Ini:** ${monthlyExpense}\n• **Runway Dana Darurat:** ${runway}\n\nKamu bisa tanya strategi menabung, evaluasi pengeluaran, atau langsung ketik transaksi seperti:\n👉 *"Catat beli kopi 25rb pakai GoPay"*`;
}

export async function POST(req: NextRequest) {
  let bodyData: any = {};
  try {
    bodyData = await req.json();
    const { message, history, contextData } = bodyData;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ text: 'Silakan ketik pesan atau pertanyaan keuanganmu.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        text: buildFallbackResponse(message, contextData),
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const walletsList = (contextData?.wallets || ['Tunai', 'Rekening Bank', 'E-Wallet']).join(', ');
    const categoriesList = (contextData?.categories || ['Makan', 'Jajan', 'Transportasi', 'Belanja Online', 'Listrik', 'Gaji']).join(', ');
    const todayIso = new Date().toISOString().split('T')[0];

    const systemInstruction = `
Kamu adalah "AI Advisor" dari aplikasi Dompt. - asisten penasihat keuangan pribadi yang cerdas, ramah, to-the-point, dan sangat paham gaya hidup finansial modern Indonesia.
Tanggal hari ini: ${todayIso}.

Konteks Keuangan Pengguna Saat Ini:
- Total Saldo: ${contextData?.totalBalance || 'Rp 0'}
- Pemasukan Bulan Ini: ${contextData?.monthlyIncome || 'Rp 0'}
- Pengeluaran Bulan Ini: ${contextData?.monthlyExpense || 'Rp 0'}
- Alokasi 50/30/20: Kebutuhan (50%), Keinginan (30%), Tabungan (20%)
- Runway Dana Darurat: ${contextData?.runway || '0 Bulan'}
- Daftar Dompet Pengguna: ${walletsList}
- Daftar Kategori Tersedia: ${categoriesList}

Tugas & Kemampuan Khusus:
1. Menjawab pertanyaan keuangan, memberikan tips hemat, saran investasi, atau roasting pengeluaran jika diminta dengan gaya santai tapi berbobot berdasarkan data di atas.
2. JIKA pengguna ingin mencatat transaksi (misal: "catat kopi 25rb pakai gopay", "belanja 375rb bca tgl 1 maret 2026"), kembalikan JSON blok terstruktur di akhir jawaban dalam format persis berikut:
\`\`\`transaction_json
{
  "type": "expense",
  "amount": 25000,
  "note": "Kopi",
  "category": "Jajan",
  "wallet": "GoPay",
  "date": "${todayIso}"
}
\`\`\`
Pastikan "type" bernilai "expense" atau "income", dan "amount" berupa angka bulat Rupiah.
Gunakan bahasa Indonesia yang ramah, santai, dan cerdas.
    `.trim();

    // Ensure conversation contents strictly start with 'user' and alternate 'user' / 'model'
    const sanitizedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const item of history || []) {
      if (!item?.text || typeof item.text !== 'string') continue;
      const role: 'user' | 'model' = item.role === 'user' ? 'user' : 'model';
      if (sanitizedHistory.length === 0 && role === 'model') {
        // Gemini requires the first turn in contents to be 'user'
        continue;
      }
      const prev = sanitizedHistory[sanitizedHistory.length - 1];
      if (prev && prev.role === role) {
        prev.parts[0].text += `\n${item.text}`;
      } else {
        sanitizedHistory.push({
          role,
          parts: [{ text: item.text }],
        });
      }
    }

    // If the last message in sanitizedHistory is already 'user', merge or replace so we end with 'user'
    if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
      sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += `\n${message}`;
    } else {
      sanitizedHistory.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let responseText = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: sanitizedHistory,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (response?.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr) {
        console.warn(`AI Advisor model ${modelName} error:`, modelErr);
      }
    }

    if (!responseText) {
      responseText = buildFallbackResponse(message, contextData);
    }

    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error('AI Advisor error:', error);
    return NextResponse.json({
      text: buildFallbackResponse(bodyData?.message || '', bodyData?.contextData || {}),
    });
  }
}
