import axios from 'axios';
import { AppError } from '../utils/errors';
import { tokenStorage } from './tokenStorage';
import { safeSourceUrl } from '../utils/safeSourceUrl';

const baseURL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async config => {
  if (!safeSourceUrl(baseURL)) {
    throw new AppError('Configure EXPO_PUBLIC_API_URL no arquivo .env com a URL do servidor.');
  }
  if (config.headers.Authorization !== false) {
    const token = await tokenStorage.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
