// Python API service (domain-agnostic)
import { pyFetch } from '@/utils/backend';
interface CreateFormRequest {
  template_id: string;
  volunteer_id?: string;
  status: string;
  data: Record<string, unknown>;
}

interface FormResponse {
  id: string;
  template_id: string;
  volunteer_id?: string;
  data: Record<string, unknown>;
  status: string;
  created_at: string;
}

class PythonApiService {

  async createForm(request: CreateFormRequest): Promise<FormResponse> {
    try {
      const data = await pyFetch('/forms', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return data as FormResponse;
    } catch (error) {
      console.error('Python API error:', error);
      // Return mock data for development
      return {
        id: Math.random().toString(36).substr(2, 9),
        template_id: request.template_id,
        volunteer_id: request.volunteer_id,
        data: request.data,
        status: request.status,
        created_at: new Date().toISOString(),
      };
    }
  }

  async getForms(params?: { volunteer_id?: string; template_id?: string }): Promise<FormResponse[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.volunteer_id) searchParams.append('volunteer_id', params.volunteer_id);
      if (params?.template_id) searchParams.append('template_id', params.template_id);

      const result = await pyFetch(`/forms?${searchParams.toString()}`, {
        method: 'GET',
      });
      return (result as any).items || [];
    } catch (error) {
      console.error('Python API error:', error);
      return [];
    }
  }
}

export const pythonApi = new PythonApiService();
export default pythonApi;