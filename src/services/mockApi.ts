// Mock API services for compatibility

export const pythonApi = {
  createForm: async (data: any) => {
    console.log('Mock pythonApi.createForm:', data);
    return { id: '1', ...data, created_at: new Date().toISOString() };
  },
  updateForm: async (id: string, data: any) => {
    console.log('Mock pythonApi.updateForm:', id, data);
    return { id, ...data, updated_at: new Date().toISOString() };
  }
};

export const formDataCollector = {
  collectFormData: (formId: string, data: any) => {
    console.log('Mock formDataCollector.collectFormData:', formId, data);
    localStorage.setItem(`form_${formId}`, JSON.stringify(data));
  },
  getFormData: (formId: string) => {
    const data = localStorage.getItem(`form_${formId}`);
    return data ? JSON.parse(data) : null;
  }
};

export const saveLocalAnswers = (formId: string, data: any) => {
  console.log('Mock saveLocalAnswers:', formId, data);
  localStorage.setItem(`answers_${formId}`, JSON.stringify(data));
};