export const environment = {
  production: true,
  apiUrl: (globalThis as any).process?.env?.API_URL || 'https://votre-backend-render.onrender.com'
};
