
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface VolunteerData {
  volunteerId: string;
  studyNumber: string;
  screeningDate?: string;
  dob?: string;
  gender?: string;
  bmi?: number;
}

export interface VolunteerContextType {
  volunteerData: VolunteerData | null;
  volunteerId: string | null;
  setVolunteerData: (data: VolunteerData) => void;
  saveLabReport: (reportType: string, data: Record<string, unknown>) => Promise<void>;
  savePatientRecord: (recordType: string, data: Record<string, unknown>) => Promise<void>;
  submitAllForms: () => Promise<void>;
  searchVolunteer: (volunteerId: string, studyNumber: string) => Promise<VolunteerData | null>;
  registerVolunteer: (data: VolunteerData) => Promise<void>;
  clearVolunteerData: () => void;
}

const VolunteerContext = createContext<VolunteerContextType | undefined>(undefined);

export const VolunteerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [volunteerData, setVolunteerData] = useState<VolunteerData | null>(null);
  const { user } = useAuth();

  const searchVolunteer = async (volunteerId: string, studyNumber: string): Promise<VolunteerData | null> => {
    try {
      // For demo users, return mock data if volunteer exists
      if (user?.id.startsWith('demo-')) {
        // Mock search - in a real implementation, this would hit the API
        if (volunteerId && studyNumber) {
          return {
            volunteerId,
            studyNumber,
            screeningDate: new Date().toISOString().split('T')[0],
          };
        }
        return null;
      }

      // For real users, call the API
      const response = await fetch(`/api/volunteers/search?volunteer_id=${volunteerId}&study_number=${studyNumber}`, {
        headers: {
          'Authorization': `Bearer ${(user as any)?.session?.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          return {
            volunteerId: data.volunteer_id,
            studyNumber: data.study_number,
            screeningDate: data.screening_date,
            dob: data.dob,
            gender: data.gender,
            bmi: data.bmi,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error searching for volunteer:', error);
      return null;
    }
  };

  const registerVolunteer = async (data: VolunteerData): Promise<void> => {
    try {
      if (user?.id.startsWith('demo-')) {
        // For demo users, just store in memory
        setVolunteerData(data);
        return;
      }

      // For real users, call the API
      const response = await fetch('/api/volunteers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(user as any)?.session?.access_token}`,
        },
        body: JSON.stringify({
          volunteer_id: data.volunteerId,
          study_number: data.studyNumber,
          screening_date: data.screeningDate,
          dob: data.dob,
          gender: data.gender,
          bmi: data.bmi,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register volunteer');
      }

      setVolunteerData(data);
    } catch (error) {
      console.error('Error registering volunteer:', error);
      throw error;
    }
  };

  const saveLabReport = async (reportType: string, data: Record<string, unknown>): Promise<void> => {
    try {
      if (!volunteerData) {
        throw new Error('No volunteer data available');
      }

      // Save as draft locally until final submit
      const draftKey = `draft_lab_report_${reportType}_${volunteerData.volunteerId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        ...data,
        volunteerId: volunteerData.volunteerId,
        studyNumber: volunteerData.studyNumber,
        reportType,
        savedAt: new Date().toISOString(),
      }));

      console.log('Lab report saved as draft:', reportType, data);
    } catch (error) {
      console.error('Error saving lab report:', error);
      throw error;
    }
  };

  const savePatientRecord = async (recordType: string, data: Record<string, unknown>): Promise<void> => {
    try {
      if (!volunteerData) {
        throw new Error('No volunteer data available');
      }

      // Save as draft locally until final submit
      const draftKey = `draft_patient_record_${recordType}_${volunteerData.volunteerId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        ...data,
        volunteerId: volunteerData.volunteerId,
        studyNumber: volunteerData.studyNumber,
        recordType,
        savedAt: new Date().toISOString(),
      }));

      console.log('Patient record saved as draft:', recordType, data);
    } catch (error) {
      console.error('Error saving patient record:', error);
      throw error;
    }
  };

  const submitAllForms = async (): Promise<void> => {
    try {
      if (!volunteerData || !user) {
        throw new Error('No volunteer data or user available');
      }

      // Get all draft data from localStorage
      const drafts: Record<string, unknown>[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`draft_`) && key.includes(volunteerData.volunteerId)) {
          const draftData = localStorage.getItem(key);
          if (draftData) {
            drafts.push(JSON.parse(draftData));
          }
        }
      }

      if (user.id.startsWith('demo-')) {
        // For demo users, just clear drafts and log
        console.log('Demo user - submitting forms:', drafts);
        drafts.forEach((draft: Record<string, unknown>) => {
          const draftKey = `draft_${draft.recordType || draft.reportType}_${volunteerData.volunteerId}`;
          localStorage.removeItem(draftKey);
        });
        return;
      }

      // Submit each form to the API
      for (const draft of drafts) {
        const response = await fetch('/api/forms/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(user as any).session?.access_token}`,
          },
          body: JSON.stringify({
            volunteer_id: volunteerData.volunteerId,
            template_id: draft.templateId, // This would need to be determined based on form type
            status: 'submitted',
            data: draft,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to submit form: ${draft.recordType || draft.reportType}`);
        }
      }

      // Clear drafts after successful submission
      drafts.forEach((draft: Record<string, unknown>) => {
        const draftKey = `draft_${draft.recordType || draft.reportType}_${volunteerData.volunteerId}`;
        localStorage.removeItem(draftKey);
      });

      console.log('All forms submitted successfully');
    } catch (error) {
      console.error('Error submitting forms:', error);
      throw error;
    }
  };

  const clearVolunteerData = () => {
    setVolunteerData(null);
    // Clear any remaining drafts
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('draft_')) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  };

  return (
    <VolunteerContext.Provider value={{
      volunteerData,
      volunteerId: volunteerData?.volunteerId || null,
      setVolunteerData,
      saveLabReport,
      savePatientRecord,
      submitAllForms,
      searchVolunteer,
      registerVolunteer,
      clearVolunteerData,
    }}>
      {children}
    </VolunteerContext.Provider>
  );
};

export const useVolunteer = () => {
  const context = useContext(VolunteerContext);
  if (context === undefined) {
    throw new Error('useVolunteer must be used within a VolunteerProvider');
  }
  return context;
};
