export const environment = {
  production: true,
  apiUrl: (globalThis as any).process?.env?.API_URL || 'https://stock-management-backend-j33r.onrender.com/api/v1'
};
