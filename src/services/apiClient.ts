import axios from "axios";

/**
 * @file Centralized API client configuration using Axios.
 * @description This module exports a pre-configured Axios instance for making
 * HTTP requests to the application's backend API. It includes a base URL
 * and can be extended with interceptors for handling tokens, errors, etc.
 */


//=============================================================================================

/**
 * The base URL for all API requests.
 * Using a relative URL ('/api') is robust as it works seamlessly in
 * development, staging, and production environments without needing
 * to configure different absolute URLs.
 */
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:3000'; 

/**
 * EN MODO DEV QUITAR /api DE LA URL DE ARRIBA
 */

//=============================================================================================

/**
 * The main Axios instance for making API requests.
 * Use this instance for all network calls.
 * @example
 * apiClient.post('/chat', { message: 'Hello' });
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15-second timeout for requests
});