import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const DATABASE_ID =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey;

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
  PROJECT_ID
)}/databases/${encodeURIComponent(DATABASE_ID)}/documents`;

function toFirestoreValue(val: any): Record<string, any> | undefined {
  if (val === undefined) return undefined;
  if (val === null) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { integerValue: '0' };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val
          .map((item) => toFirestoreValue(item))
          .filter((v): v is Record<string, any> => v !== undefined),
      },
    };
  }
  if (typeof val === 'object') {
    return {
      mapValue: {
        fields: toFirestoreFields(val),
      },
    };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    // Skip Firebase deleteField() sentinel objects
    if (v && typeof v === 'object' && '_methodName' in v) continue;
    const converted = toFirestoreValue(v);
    if (converted !== undefined) {
      fields[k] = converted;
    }
  }
  return fields;
}

function fromFirestoreValue(valObj: Record<string, any>): any {
  if (!valObj || typeof valObj !== 'object') return null;
  if ('stringValue' in valObj) return valObj.stringValue;
  if ('booleanValue' in valObj) return Boolean(valObj.booleanValue);
  if ('integerValue' in valObj) return Number(valObj.integerValue);
  if ('doubleValue' in valObj) return Number(valObj.doubleValue);
  if ('nullValue' in valObj) return null;
  if ('timestampValue' in valObj) return valObj.timestampValue;
  if ('arrayValue' in valObj) {
    const arr = valObj.arrayValue?.values || [];
    return arr.map((item: Record<string, any>) => fromFirestoreValue(item));
  }
  if ('mapValue' in valObj) {
    return fromFirestoreFields(valObj.mapValue?.fields || {});
  }
  return null;
}

function fromFirestoreFields(fields?: Record<string, any>): Record<string, any> {
  if (!fields) return {};
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    result[k] = fromFirestoreValue(v);
  }
  return result;
}

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
    const body = await req.json();
    const { action, path, data, merge } = body as {
      action: 'get' | 'list' | 'set' | 'delete';
      path: string;
      data?: Record<string, any>;
      merge?: boolean;
    };

    if (!path || typeof path !== 'string' || !path.startsWith('users/')) {
      return createNoCacheResponse({ ok: false, error: 'Invalid path' }, 400);
    }

    const cleanPath = path.replace(/^\/+|\/+$/g, '');

    if (action === 'get') {
      const url = `${BASE_URL}/${cleanPath}?key=${encodeURIComponent(API_KEY)}`;
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (res.status === 404) {
        return createNoCacheResponse({ ok: true, exists: false, data: null });
      }
      if (!res.ok) {
        const errText = await res.text();
        return createNoCacheResponse(
          { ok: false, status: res.status, error: errText },
          200
        );
      }
      const docJson = await res.json();
      return createNoCacheResponse({
        ok: true,
        exists: true,
        data: fromFirestoreFields(docJson.fields),
      });
    }

    if (action === 'list') {
      const url = `${BASE_URL}/${cleanPath}?pageSize=300&key=${encodeURIComponent(API_KEY)}`;
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (res.status === 404) {
        return createNoCacheResponse({ ok: true, docs: [] });
      }
      if (!res.ok) {
        const errText = await res.text();
        return createNoCacheResponse(
          { ok: false, status: res.status, error: errText, docs: [] },
          200
        );
      }
      const listJson = await res.json();
      const docs = Array.isArray(listJson.documents)
        ? listJson.documents.map((d: any) => fromFirestoreFields(d.fields))
        : [];
      return createNoCacheResponse({ ok: true, docs });
    }

    if (action === 'set') {
      const fields = toFirestoreFields(data || {});
      const fieldKeys = Object.keys(fields);
      const maskQuery =
        merge && fieldKeys.length > 0
          ? '&' +
            fieldKeys
              .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
              .join('&')
          : '';
      const url = `${BASE_URL}/${cleanPath}?key=${encodeURIComponent(API_KEY)}${maskQuery}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        body: JSON.stringify({ fields }),
        cache: 'no-store',
      });
      if (!res.ok) {
        const errText = await res.text();
        return createNoCacheResponse(
          { ok: false, status: res.status, error: errText },
          200
        );
      }
      const savedJson = await res.json();
      return createNoCacheResponse({
        ok: true,
        data: fromFirestoreFields(savedJson.fields),
      });
    }

    if (action === 'delete') {
      const url = `${BASE_URL}/${cleanPath}?key=${encodeURIComponent(API_KEY)}`;
      const res = await fetch(url, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      return createNoCacheResponse({ ok: res.ok || res.status === 404 });
    }

    return createNoCacheResponse({ ok: false, error: 'Unsupported action' }, 400);
  } catch (err: any) {
    return createNoCacheResponse(
      { ok: false, error: err?.message || 'Internal error' },
      200
    );
  }
}
