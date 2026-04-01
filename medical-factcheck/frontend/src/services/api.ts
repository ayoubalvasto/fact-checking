import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000');
const MAX_RETRIES = 3;

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with context
api.interceptors.request.use(
  (config) => {
    const timestamp = new Date().toISOString();
    config.headers['X-Request-ID'] = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error(`❌ Request setup error: ${error.message}`);
    return Promise.reject(error);
  }
);

// Response interceptor with error handling
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} ${response.statusText} (${response.config.url})`);
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error(`❌ API Error ${error.response.status}: ${error.response.statusText}`);
      if (error.response.status === 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error(`❌ No response from server: ${error.message}`);
    } else {
      // Error in request setup
      console.error(`❌ API Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      const isRetryableError = 
        axios.isAxiosError(error) && 
        (error.code === 'ECONNABORTED' || 
         error.code === 'ENOTFOUND' ||
         error.response?.status === 503 ||
         error.response?.status === 429);
      
      if (isLastAttempt || !isRetryableError) {
        throw error;
      }
      
      console.warn(`⚠️  Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}

export interface VerificationResult {
  original_text: string;
  original_language: string;
  darija_latin: string;
  darija_arabic: string;
  claim: string;
  claim_type: string;
  verification_label: 'true' | 'false' | 'partially_true' | 'unverifiable';
  explanation: string;
  confidence_score: number;
  source_url?: string;
  medical_domain: string;
  processing_time_ms?: number;
}

export interface VerifyResponse {
  success: boolean;
  data: VerificationResult;
  claim_id: number;
  timestamp: string;
  message?: string;
}

export const apiClient = {
  // Verification endpoints
  verify: async (text: string, language: string = 'ar'): Promise<VerifyResponse> => {
    return retryWithBackoff(() =>
      api.post('/verify/', { text, language }).then(r => r.data),
      MAX_RETRIES
    );
  },

  verifyBatch: async (texts: string[], language: string = 'ar'): Promise<any> => {
    return retryWithBackoff(() =>
      api.post('/verify/batch', { texts, language }).then(r => r.data),
      MAX_RETRIES
    );
  },

  // Dataset endpoints
  getDataset: async (page: number = 1, perPage: number = 20, filters?: any) => {
    return retryWithBackoff(() =>
      api.get('/dataset/claims', {
        params: { page, per_page: perPage, ...filters },
      }).then(r => r.data),
      MAX_RETRIES
    );
  },

  getDomainDistribution: async (days: number = 7) => {
    return retryWithBackoff(() =>
      api.get('/dataset/stats/domains', { params: { days } }).then(r => r.data),
      MAX_RETRIES
    );
  },

  // Analytics endpoints
  getDashboardAnalytics: async (days: number = 7) => {
    return retryWithBackoff(() =>
      api.get('/analytics/dashboard', { params: { days } }).then(r => r.data),
      MAX_RETRIES
    );
  },

  getTrendingClaims: async (limit: number = 10) => {
    return retryWithBackoff(() =>
      api.get('/analytics/trending', { params: { limit } }).then(r => r.data),
      MAX_RETRIES
    );
  },

  getConfidenceDistribution: async (days: number = 7) => {
    return retryWithBackoff(() =>
      api.get('/analytics/confidence-distribution', { params: { days } }).then(r => r.data),
      MAX_RETRIES
    );
  },

  // Health check with retries
  healthCheck: async () => {
    try {
      const response = await retryWithBackoff(() =>
        api.get('/health/').then(r => r.data),
        3,
        500
      );
      return { ...response, status: response.status || 'healthy' };
    } catch (error) {
      console.error('Health check failed:', error);
      return { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Get API statistics
  getApiStats: async () => {
    const startTime = performance.now();
    try {
      await api.get('/health/');
      const elapsed = performance.now() - startTime;
      return { 
        latency_ms: Math.round(elapsed),
        status: 'healthy'
      };
    } catch (error) {
      const elapsed = performance.now() - startTime;
      return { 
        latency_ms: Math.round(elapsed),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default api;
