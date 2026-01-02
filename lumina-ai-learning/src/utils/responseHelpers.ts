export async function parseJsonSafe(response: Response): Promise<{ json?: any; text: string }> {
  const text = await response.text();
  if (!text || text.trim().length === 0) return { json: undefined, text: '' };

  try {
    return { json: JSON.parse(text), text };
  } catch (e) {
    return { json: undefined, text };
  }
}

export async function assertOkOrThrow(response: Response): Promise<{ json?: any; text: string }> {
  const { json, text } = await parseJsonSafe(response);

  if (!response.ok) {
    const message = json?.error?.message || json?.message || text || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return { json, text };
}
