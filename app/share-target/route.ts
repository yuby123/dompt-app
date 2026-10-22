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
    const file = formData.get('screenshot') as File | null;

    if (!file) {
      return NextResponse.redirect(new URL('/?scan=open', req.url), 303);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';
    const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Return simple HTML page that stores the image in sessionStorage and redirects to main page
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Menerima Screenshot...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="background:#0F766E;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h2>Menerima Screenshot...</h2>
            <p>Membuka Dompt. untuk Ekstraksi Otomatis...</p>
          </div>
          <script>
            try {
              sessionStorage.setItem('dompt_shared_image', ${JSON.stringify(base64)});
              sessionStorage.setItem('dompt_shared_mime', ${JSON.stringify(mimeType)});
            } catch (e) {
              console.error(e);
            }
            window.location.replace('/?scan=auto');
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
