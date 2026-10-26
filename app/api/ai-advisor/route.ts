import { GoogleGenAI } from '@google/genai';
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

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseNaturalLanguageTransaction(
  message: string,
  availableWallets: string[],
  availableCategories: string[]
) {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // Do not treat questions (e.g. "Bisa beli HP 3jt?") as transaction recording unless explicitly prefixed with "catat"
  const isQuestion =
    trimmed.endsWith('?') ||
    /^(bisa|boleh|apakah|gimana|bagaimana|kapan|berapa|aman|mending|sebaiknya)\b/i.test(trimmed);
  const startsWithCatat = /^catat\b/i.test(trimmed);

  if (isQuestion && !startsWithCatat) {
    return null;
  }

  const txKeywords = [
    'catat',
    'beli',
    'belanja',
    'bayar',
    'makan',
    'sarapan',
    'jajan',
    'ngopi',
    'kopi',
    'bensin',
    'parkir',
    'ojol',
    'gaji',
    'bonus',
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

  // Sort wallets by length descending so multi-word wallets ("Dompet Utama") match first
  const sortedWallets = [...availableWallets].sort((a, b) => b.length - a.length);
  let matchedWallet = sortedWallets.find((w) => lower.includes(w.toLowerCase())) || '';
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

  // Sort categories by length descending
  const sortedCategories = [...availableCategories].sort((a, b) => b.length - a.length);
  let matchedCategory = sortedCategories.find((c) => lower.includes(c.toLowerCase())) || '';
  if (!matchedCategory) {
    if (isIncome) matchedCategory = 'Gaji';
    else if (lower.includes('makan') || lower.includes('sarapan') || lower.includes('siang') || lower.includes('malam'))
      matchedCategory = 'Makan';
    else if (lower.includes('kopi') || lower.includes('ngopi') || lower.includes('jajan') || lower.includes('cemilan'))
      matchedCategory = 'Jajan';
    else if (lower.includes('bensin') || lower.includes('ojol') || lower.includes('parkir') || lower.includes('transport'))
      matchedCategory = 'Transportasi';
    else if (lower.includes('listrik') || lower.includes('pln') || lower.includes('wifi') || lower.includes('kuota'))
      matchedCategory = 'Tagihan';
    else if (lower.includes('belanja')) matchedCategory = 'Belanja';
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
  const dateMatch = lower.match(
    /(?:tgl|tanggal)?\s*(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)(?:\s+(\d{4}))?/i
  );
  if (dateMatch) {
    const day = String(dateMatch[1]).padStart(2, '0');
    const month = monthsMap[dateMatch[2].toLowerCase()] || '01';
    const year = dateMatch[3] || String(new Date().getFullYear());
    dateStr = `${year}-${month}-${day}`;
  }

  // Build clean note and strip wallet phrase cleanly (including multi-word wallet names)
  let cleanNote = trimmed
    .replace(/^catat\s+/i, '')
    .replace(matchedAmountRaw, '');

  if (matchedWallet) {
    const walletPattern = new RegExp(
      `\\b(pakai|pake|via|dengan|di|ke)?\\s*${escapeRegExp(matchedWallet)}\\b`,
      'gi'
    );
    cleanNote = cleanNote.replace(walletPattern, '');
  }

  cleanNote = cleanNote
    .replace(/\b(pakai|pake|via|dengan)\s+\S+/gi, '')
    .replace(/\b(tgl|tanggal)\s*\d{1,2}\s+\w+(\s+\d{4})?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    type: isIncome ? 'income' : 'expense',
    amount: detectedAmount,
    note: cleanNote ? cleanNote.charAt(0).toUpperCase() + cleanNote.slice(1) : matchedCategory,
    category: matchedCategory,
    wallet: matchedWallet,
    date: dateStr,
  };
}

function buildFallbackResponse(message: string, contextData: any): string {
  const walletsList: string[] = contextData?.wallets || ['Tunai', 'Rekening Bank', 'E-Wallet'];
  const categoriesList: string[] = contextData?.categories || [
    'Makan',
    'Jajan',
    'Transportasi',
    'Belanja',
    'Tagihan',
    'Gaji',
  ];

  const parsedTx = parseNaturalLanguageTransaction(message, walletsList, categoriesList);
  if (parsedTx) {
    return `Draf transaksi sudah siap. Periksa detail di bawah lalu klik **Simpan**:\n\n\`\`\`transaction_json\n${JSON.stringify(parsedTx, null, 2)}\n\`\`\``;
  }

  const lower = message.toLowerCase();
  const totalBalance = contextData?.totalBalance || 'Rp 0';
  const monthlyIncome = contextData?.monthlyIncome || 'Rp 0';
  const monthlyExpense = contextData?.monthlyExpense || 'Rp 0';
  const budgetLimit = contextData?.budgetLimit || monthlyIncome;
  const dailyQuota = contextData?.dailyBudgetQuota || contextData?.dailyBudgetRemaining || 'Rp 0';
  const dailyRemaining = contextData?.dailyBudgetRemaining || 'Rp 0';
  const todaySpent = contextData?.todayVariableExpense || 'Rp 0';
  const runway = contextData?.runway || '0 Bulan';

  if (lower.includes('roasting') || lower.includes('boros')) {
    return `**Evaluasi Jujur Bulan Ini**\n• Pengeluaran: **${monthlyExpense}** dari budget **${budgetLimit}**\n• Jatah harian: **${dailyQuota}/hari** (Sisa hari ini: **${dailyRemaining}**)\n• Dana darurat: **${runway}**\n\nKurangi jajan impulsif dan jaga pengeluaran harian tidak melebihi jatah harianmu agar target tabungan tetap aman.`;
  }

  if (lower.includes('harian') || lower.includes('sisa') || lower.includes('kuota')) {
    return `**Kondisi Kuota Harianmu**\n• Jatah kuota harian: **${dailyQuota}/hari**\n• Terpakai hari ini: **${todaySpent}**\n• Sisa kuota hari ini: **${dailyRemaining}**\n• Total pengeluaran bulan ini: **${monthlyExpense}**\n\nUsahakan pengeluaran hari ini tidak melewati sisa kuota **${dailyRemaining}**.`;
  }

  if (lower.includes('hp') || lower.includes('beli') || lower.includes('barang')) {
    return `**Cek kesiapan sebelum membeli:**\n• Saldo likuid: **${totalBalance}** (Runway: **${runway}**)\n• Jatah harian: **${dailyQuota}/hari** (Sisa hari ini: **${dailyRemaining}**)\n\nPastikan dana darurat minimal 3 bulan tidak terpakai dan gunakan fitur **Goals** untuk menabung barang impian tanpa mengganggu uang harian.`;
  }

  if (lower.includes('analisis') || lower.includes('evaluasi') || lower.includes('cek budget') || lower.includes('hemat')) {
    return `**Ringkasan Keuanganmu**\n• Saldo Likuid: **${totalBalance}**\n• Basis Budget: **${budgetLimit}**\n• Terpakai Bulan Ini: **${monthlyExpense}**\n• Jatah Kuota Harian: **${dailyQuota}/hari** (Sisa hari ini: **${dailyRemaining}**)\n\nTips: Jaga pengeluaran keinginan maksimal 30% dari budget dan disiplin pada jatah harianmu.`;
  }

  return `**Posisi Keuangan Saat Ini**\n• Saldo Aktif: **${totalBalance}**\n• Terpakai: **${monthlyExpense}** (Budget: **${budgetLimit}**)\n• Jatah Harian: **${dailyQuota}/hari** (Sisa hari ini: **${dailyRemaining}**)\n\nKetik langsung untuk mencatat, contoh: *"Catat kopi 25rb pakai Tunai"*.`;
}

export async function POST(req: NextRequest) {
  let bodyData: any = {};
  try {
    bodyData = await req.json();
    const { message, history, contextData } = bodyData;

    if (!message || typeof message !== 'string') {
      return createNoCacheResponse({ text: 'Ketik pertanyaan atau transaksi yang ingin dicatat.' }, 400);
    }

    const walletsArr: string[] = contextData?.wallets || ['Tunai', 'Rekening Bank', 'E-Wallet'];
    const categoriesArr: string[] = contextData?.categories || [
      'Makan',
      'Jajan',
      'Transportasi',
      'Belanja',
      'Tagihan',
      'Gaji',
    ];

    // Fast-path deterministic transaction extraction when user explicitly starts with "catat"
    if (/^catat\b/i.test(message.trim())) {
      const quickTx = parseNaturalLanguageTransaction(message, walletsArr, categoriesArr);
      if (quickTx) {
        return createNoCacheResponse({
          text: `Draf transaksi sudah siap. Periksa detail di bawah lalu klik **Simpan**:\n\n\`\`\`transaction_json\n${JSON.stringify(quickTx, null, 2)}\n\`\`\``,
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return createNoCacheResponse({
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

    const walletsList = walletsArr.join(', ');
    const categoriesList = categoriesArr.join(', ');
    const todayIso = new Date().toISOString().split('T')[0];

    const systemInstruction = `
Kamu adalah "AI Advisor" di aplikasi keuangan Dompt.
Gaya bahasa: Bahasa Indonesia yang singkat, lugas, ramah, dan langsung ke inti (maksimal 3-4 poin pendek, jangan bertele-tele).
Tanggal hari ini: ${todayIso}.

Data Keuangan Pengguna:
- Saldo Aktif Likuid: ${contextData?.totalBalance || 'Rp 0'}
- Basis Budget Bulan Ini: ${contextData?.budgetLimit || contextData?.monthlyIncome || 'Rp 0'}
- Pemasukan Bulan Ini: ${contextData?.monthlyIncome || 'Rp 0'}
- Pengeluaran Bulan Ini: ${contextData?.monthlyExpense || 'Rp 0'}
- Jatah / Kuota Harian Aktif: ${contextData?.dailyBudgetQuota || contextData?.dailyBudgetRemaining || 'Rp 0'}/hari
- Pengeluaran Harian Hari Ini: ${contextData?.todayVariableExpense || 'Rp 0'}
- Sisa Kuota Hari Ini: ${contextData?.dailyBudgetRemaining || 'Rp 0'} (dari jatah harian ${contextData?.dailyBudgetQuota || 'Rp 0'}/hari)
- Sisa Saldo Pos Harian Periode Ini: ${contextData?.remainingVariableBudget || 'Rp 0'}
- Dana Darurat: ${contextData?.runway || '0 Bulan'}
- Dompet: ${walletsList}
- Kategori: ${categoriesList}

Pedoman Penting Soal Kuota & Sisa Harian:
1. Jatah kuota budget harian pengguna adalah ${contextData?.dailyBudgetQuota || 'Rp 0'}/hari. Ini adalah limit jatah harian yang benar.
2. Angka ${contextData?.dailyBudgetRemaining || 'Rp 0'} adalah SISA kuota yang tersisa untuk hari ini (setelah terpakai ${contextData?.todayVariableExpense || 'Rp 0'} hari ini). JANGAN PERNAH menyebut sisa kuota hari ini sebagai limit harian /hari. Jika membahas batas harian, selalu sebut jatah harian adalah ${contextData?.dailyBudgetQuota || 'Rp 0'}/hari dan sisa untuk hari ini tinggal ${contextData?.dailyBudgetRemaining || 'Rp 0'}.
3. Jawab singkat dan mudah dibaca (maksimal 3-4 kalimat/poin).
4. JIKA pengguna ingin mencatat transaksi (contoh: "catat kopi 25rb pakai gopay", "makan siang 35rb tunai"), sertakan blok JSON di akhir jawaban dengan format persis:
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
Pastikan "type" bernilai "expense" atau "income", dan "amount" angka bulat Rupiah. Jangan buat blok transaction_json jika pengguna hanya bertanya.
    `.trim();

    const sanitizedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const item of history || []) {
      if (!item?.text || typeof item.text !== 'string') continue;
      const role: 'user' | 'model' = item.role === 'user' ? 'user' : 'model';
      if (sanitizedHistory.length === 0 && role === 'model') {
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

    if (
      sanitizedHistory.length > 0 &&
      sanitizedHistory[sanitizedHistory.length - 1].role === 'user'
    ) {
      sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += `\n${message}`;
    } else {
      sanitizedHistory.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

    const modelsToTry = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-flash-latest'];
    let responseText = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: sanitizedHistory,
          config: {
            systemInstruction,
            temperature: 0.5,
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

    return createNoCacheResponse({ text: responseText });
  } catch (error: any) {
    console.error('AI Advisor error:', error);
    return createNoCacheResponse({
      text: buildFallbackResponse(bodyData?.message || '', bodyData?.contextData || {}),
    });
  }
}
