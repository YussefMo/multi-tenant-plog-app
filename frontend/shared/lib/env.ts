const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api';
const apiVersion = (import.meta.env.VITE_API_VERSION as string | undefined) ?? 'v1';

export const env = {
  apiUrl: apiUrl.replace(/\/$/, ''),
  apiVersion: apiVersion.replace(/^\/|\/$/g, ''),
  appName: (import.meta.env.VITE_APP_NAME as string | undefined) ?? 'Multi Tenant Plog',
};

export const apiBaseUrl = `${env.apiUrl}/${env.apiVersion}`;
