import { getPyApiBase } from './backend';

export async function uploadToServer(file: File, entityType: string, entityId: number) {
  const base = getPyApiBase();
  const form = new FormData();
  form.append('entity_type', entityType);
  form.append('entity_id', String(entityId));
  form.append('file', file, file.name);
  const apiKey = (import.meta as any).env?.PYTHON_API_KEY;
  const resp = await fetch(`${base}/uploads/upload`, { method: 'POST', headers: apiKey ? { 'X-API-Key': apiKey } : undefined, body: form });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}
