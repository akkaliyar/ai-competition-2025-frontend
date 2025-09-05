// API Configuration for Railway deployment

const getApiBaseUrl = (): string => {
  // Use Railway backend for both development and production
  return process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
};

export const API_BASE_URL = getApiBaseUrl();
