import axios, { AxiosError } from 'axios';
import { config } from '../config';

export const apiService = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenProvider: (() => Promise<string | null>) | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setTokenProvider(provider: () => Promise<string | null>) {
  tokenProvider = provider;
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

apiService.interceptors.request.use(async (reqConfig) => {
  if (tokenProvider) {
    try {
      const token = await tokenProvider();
      if (token) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error retrieving auth token for request:', e);
    }
  }
  return reqConfig;
});

apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  },
);

export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'An unexpected error occurred.'
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
