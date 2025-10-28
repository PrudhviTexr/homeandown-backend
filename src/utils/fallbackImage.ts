// Centralized fallback image (inline SVG) to avoid external placeholder network calls
export const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <g fill="#9ca3af" font-family="Segoe UI, Roboto, Arial, sans-serif" text-anchor="middle">
        <text x="300" y="200" font-size="20">No Image Available</text>
      </g>
    </svg>
  `);

export default FALLBACK_IMAGE;
