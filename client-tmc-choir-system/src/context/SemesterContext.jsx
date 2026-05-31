import { createContext, useContext } from 'react';
import { useSemesters } from '../hooks/useSemesters';

const SemesterContext = createContext(null);

export function SemesterProvider({ children }) {
  const semesterData = useSemesters();
  return (
    <SemesterContext.Provider value={semesterData}>
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemesterContext() {
  const ctx = useContext(SemesterContext);
  if (!ctx) throw new Error('useSemesterContext must be used within SemesterProvider');
  return ctx;
}
