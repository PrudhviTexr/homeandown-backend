// Global type declarations for missing services
declare global {
  var pythonApi: {
    createForm: (data: any) => Promise<any>;
    updateForm: (id: string, data: any) => Promise<any>;
  };

  var formDataCollector: {
    collectFormData: (formId: string, data: any) => void;
    getFormData: (formId: string) => any;
  };

  var saveLocalAnswers: (formId: string, data: any) => void;
  var setLoading: (loading: boolean) => void;
  var mentalStatus: string;
  var answers: Record<string, any>;
  var ChevronLeft: any;
  var medicalHistoryItems: any[];
  var familyHistoryItems: any[];
  var allergyItems: any[];
  var generalRemarks: string;
}

export {};