import {
  PredictRequest,
  PredictResponse,
  PaginatedPredictionsResponse,
  PredictionItem,
  AnalyticsSummary,
  DistributionsData,
  ModelInfo,
  DatasetValidationResponse,
  FoodGuideline
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
        }
      }
    } catch {
      // Use fallback errorMsg
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  // Prediction
  predictShelfLife: async (data: PredictRequest): Promise<PredictResponse> => {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<PredictResponse>(res);
  },

  // Prediction History
  getPredictions: async (params: {
    page?: number;
    pageSize?: number;
    category?: string;
    statusFilter?: string;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<PaginatedPredictionsResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('page_size', params.pageSize.toString());
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.statusFilter && params.statusFilter !== 'All') query.append('status_filter', params.statusFilter);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sort_by', params.sortBy);
    if (params.order) query.append('order', params.order);

    const res = await fetch(`${API_BASE}/predictions?${query.toString()}`);
    return handleResponse<PaginatedPredictionsResponse>(res);
  },

  getPredictionDetail: async (id: string | number): Promise<PredictionItem> => {
    const res = await fetch(`${API_BASE}/predictions/${id}`);
    return handleResponse<PredictionItem>(res);
  },

  deletePrediction: async (id: string | number): Promise<{ message: string; deleted_id: string }> => {
    const res = await fetch(`${API_BASE}/predictions/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  getCsvExportUrl: (): string => {
    return `${API_BASE}/predictions/export/csv`;
  },

  // Analytics
  getAnalyticsSummary: async (): Promise<AnalyticsSummary> => {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    return handleResponse<AnalyticsSummary>(res);
  },

  getAnalyticsDistributions: async (): Promise<DistributionsData> => {
    const res = await fetch(`${API_BASE}/analytics/distributions`);
    return handleResponse<DistributionsData>(res);
  },

  // Model Info & Retraining
  getModelInfo: async (): Promise<ModelInfo> => {
    const res = await fetch(`${API_BASE}/model/info`);
    return handleResponse<ModelInfo>(res);
  },

  retrainModel: async (confirm: boolean = true, testSize: number = 0.2, randomState: number = 42): Promise<any> => {
    const res = await fetch(`${API_BASE}/model/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm, test_size: testSize, random_state: randomState })
    });
    return handleResponse(res);
  },

  // Dataset Validation
  validateDatasetFile: async (file: File): Promise<DatasetValidationResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/dataset/validate`, {
      method: 'POST',
      body: formData
    });
    return handleResponse<DatasetValidationResponse>(res);
  },

  getActiveDatasetInfo: async (): Promise<DatasetValidationResponse> => {
    const res = await fetch(`${API_BASE}/dataset/active-info`);
    return handleResponse<DatasetValidationResponse>(res);
  },

  // Food Storage Science Guidelines
  getFoodGuidelines: async (): Promise<{ status: string; disclaimer: string; guidelines: FoodGuideline[] }> => {
    const res = await fetch(`${API_BASE}/food-guidelines`);
    return handleResponse(res);
  }
};
