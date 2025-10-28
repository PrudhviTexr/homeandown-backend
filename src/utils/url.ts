// Utility to build SEO-friendly property URLs and parse them back
export function slugify(text: string) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// We use only the slugified title for SEO-friendly URLs
export function buildPropertyUrl(title: string, id: string) {
  const slug = slugify(title) || 'property';
  return `/property/${slug}`;
}

export function extractSlugFromParam(param: string | undefined) {
  if (!param) return undefined;
  // Return the slug directly since we're not using IDs in URLs anymore
  return param;
}

export default { slugify, buildPropertyUrl, extractSlugFromParam };
