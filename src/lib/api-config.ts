/** Live API for journals, reports, and holdings (Cloudflare Worker + D1). */
export const API_BASE =
  (import.meta.env.PUBLIC_API_BASE as string | undefined)?.replace(/\/$/, '') ||
  'https://save.sr-investing.com';

export const API_TOKEN_KEY = 'shen-api-token';
