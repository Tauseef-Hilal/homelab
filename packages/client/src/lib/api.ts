import axios from 'axios';
import { env } from '@shared/config/env';

export const api = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true,
});
