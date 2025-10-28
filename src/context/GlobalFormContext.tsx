
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalFormContextType {
  studyNo: string | null;
  setStudyNo: (studyNo: string | null) => void;
  subjectNo: string | null;
  setSubjectNo: (subjectNo: string | null) => void;
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  caseId: string | null;
  setCaseId: (id: string | null) => void;
  volunteerId: string | null;
  setVolunteerId: (id: string | null) => void;
}

const GlobalFormContext = createContext<GlobalFormContextType | undefined>(undefined);

export const useGlobalForm = () => {
  const context = useContext(GlobalFormContext);
  if (context === undefined) {
    throw new Error('useGlobalForm must be used within a GlobalFormProvider');
  }
  return context;
};

interface GlobalFormProviderProps {
  children: ReactNode;
}

export const GlobalFormProvider: React.FC<GlobalFormProviderProps> = ({ children }) => {
  const [studyNo, setStudyNo] = useState<string | null>(null);
  const [subjectNo, setSubjectNo] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [volunteerId, setVolunteerId] = useState<string | null>(null);

  const value = {
    studyNo,
    setStudyNo,
    subjectNo,
    setSubjectNo,
    projectId,
    setProjectId,
    caseId,
    setCaseId,
    volunteerId,
    setVolunteerId
  };

  return (
    <GlobalFormContext.Provider value={value}>
      {children}
    </GlobalFormContext.Provider>
  );
};
