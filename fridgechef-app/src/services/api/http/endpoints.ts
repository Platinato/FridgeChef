/** Backend paths (api-contract.md). One of the three files that know the wire format. */
export const endpoints = {
  catalog: '/v1/catalog',
  detect: '/v1/scans/detect',
  suggest: '/v1/recipes/suggest',
  recipe: (id: string) => `/v1/recipes/${encodeURIComponent(id)}`,
} as const;

/** Joins a base URL (with or without a trailing slash, with or without a path prefix) and a path. */
export const joinUrl = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
