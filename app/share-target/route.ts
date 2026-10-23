import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    let file: File | null = null;

    // 1. Check known keys sent by various mobile OS share sheets
    const candidateKeys = ['files', 'screenshot', 'file', 'image', 'photos', 'media'];
    for (const key of candidateKeys) {
      const candidate = formData.get(key);
      if (candidate instanceof File && candidate.size > 0) {
        file = candidate;
        break;
      }
    }

    // 2. Fallback: inspect all entries in formData for any File with image type or size > 0
    if (!file) {
      for (const [, val] of formData.entries()) {
        if (val instanceof File && val.size > 0) {
          if (val.type?.startsWith('image/') || val.name?.match(/\.(png|jpe?g|webp|heic)$/i)) {
            file = val;
            break;
          }
        }
      }
    }

    if (!file) {
      return NextResponse.redirect(new URL('/?scan=open&error=no_file', req.url), 303);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';
    const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Return HTML page that writes to both sessionStorage and localStorage for maximum PWA reliability, then redirects
    const html = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>Menerima Screenshot Transaksi...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
          <style>
            body {
              background: #090A10;
              color: #F8FAFC;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background: #16181D;
              border: 1px solid rgba(212, 248, 38, 0.3);
              border-radius: 24px;
              padding: 28px 24px;
              text-align: center;
              max-width: 360px;
              width: 100%;
              box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            }
            .spinner {
              width: 44px;
              height: 44px;
              border: 4px solid rgba(212, 248, 38, 0.2);
              border-top-color: #D4F826;
              border-radius: 50%;
              margin: 0 auto 16px;
              animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            h2 {
              font-size: 18px;
              font-weight: 800;
              margin: 0 0 6px;
              color: #FFFFFF;
            }
            p {
              font-size: 13px;
              color: #94A3B8;
              margin: 0;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h2>Menerima Screenshot...</h2>
            <p>Membuka Dompt. untuk membaca nominal transaksi secara otomatis.</p>
          </div>
          <script>
            (function() {
              try {
                var imgData = ${JSON.stringify(base64)};
                var mime = ${JSON.stringify(mimeType)};
                var now = Date.now().toString();
                sessionStorage.setItem('dompt_shared_image', imgData);
                sessionStorage.setItem('dompt_shared_mime', mime);
                localStorage.setItem('dompt_pending_screenshot', imgData);
                localStorage.setItem('dompt_pending_mime', mime);
                localStorage.setItem('dompt_pending_time', now);
              } catch (e) {
                console.error('Storage error:', e);
              }
              window.location.replace('/?scan=auto&shared=true&t=' + Date.now());
            })();
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...NO_CACHE_HEADERS,
      },
    });
  } catch (err) {
    console.error('Error handling share target:', err);
    return NextResponse.redirect(new URL('/', req.url), 303);
  }
}
