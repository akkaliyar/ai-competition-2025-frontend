// API Configuration for Railway deployment

const getApiBaseUrl = (): string => {
  // Use Railway backend for both development and production
  return process.env.REACT_APP_API_URL || 'https://ai-competition-2025-backend-production.up.railway.app/api';
};

export const API_BASE_URL = getApiBaseUrl();
