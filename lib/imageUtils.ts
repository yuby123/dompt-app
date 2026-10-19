/**
 * Utility to compress images in browser before sending to server
 * Reduces multi-megabyte mobile screenshots (5-15MB) to ~120-200KB
 * preserving high text clarity for OCR while drastically speeding up network upload.
 */
export async function compressImageForOcr(
  fileOrBase64: File | string,
  maxDimension = 1200,
  quality = 0.82
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          if (typeof fileOrBase64 === 'string') {
            resolve({ base64: fileOrBase64, mimeType: 'image/jpeg' });
          } else {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ base64: reader.result as string, mimeType: fileOrBase64.type || 'image/jpeg' });
            reader.readAsDataURL(fileOrBase64);
          }
          return;
        }

        // Fill white background for transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          base64: compressedDataUrl,
          mimeType: 'image/jpeg',
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Gagal membaca gambar'));
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
