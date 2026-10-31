/** Shared response helpers for Pages Functions. */

export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init?.headers ?? {})
    }
  })
}

export function errorJson(code: string, message: string, status: number): Response {
  return json({ ok: false, error: { code, message } }, { status })
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  const raw = await request.text()
  if (raw.length > maxBytes) {
    throw new Error('BODY_TOO_LARGE')
  }
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('BODY_NOT_OBJECT')
    }
    return parsed as Record<string, unknown>
  } catch {
    throw new Error('BODY_INVALID_JSON')
  }
}
