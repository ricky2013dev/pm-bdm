import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import PatientList from './PatientList';
import PatientDetail from './PatientDetail';
import Header from '@/components/Header';
import { Patient, FilterType, TabType, TAB_TYPES } from '@/types/patient';
import patientsData from '@mockupdata/patients.json';

const patients = Array.isArray(patientsData) ? patientsData : (patientsData as any).default || [];

const PatientDetailPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>(TAB_TYPES.AI_CALL_HISTORY);

  // Extract patientId from URL query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1] || '');
    const id = searchParams.get('patientId');

    if (id) {
      const foundPatient = patients.find(p => p.id === id);
      if (foundPatient) {
        setSelectedPatientId(id);
      }
    } else {
      // Default to Sarah Jane Johnson (ID: 1001) if no patientId is provided
      setSelectedPatientId('1001');
    }
  }, [location]);

  const filteredPatients = React.useMemo(() => {
    return patients.filter(patient => {
      // Search filter
      if (searchQuery) {
        const fullName = `${patient.name.given.join(' ')} ${patient.name.family}`.toLowerCase();
        const email = patient.telecom.find(t => t.system === 'email')?.value.toLowerCase() || '';
        const query = searchQuery.toLowerCase();

        if (!fullName.includes(query) && !email.includes(query)) {
          return false;
        }
      }

      // Active/Inactive filters
      if (activeFilters.includes('Active') && !patient.active) return false;
      if (activeFilters.includes('Inactive') && patient.active) return false;

      // Verification step filters
      const stepFilters = activeFilters.filter(f =>
        f === 'Eligibility' || f === 'Verification'
      );
      if (stepFilters.length > 0) {
        const getPatientVerificationStep = (p: Patient) => {
          if (!p.verificationStatus) return 0;
          const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = p.verificationStatus;

          if (saveToPMS === 'completed' || saveToPMS === 'in_progress') return 5;
          if (callCenter === 'completed' || callCenter === 'in_progress') return 4;
          if (apiVerification === 'completed' || apiVerification === 'in_progress') return 3;
          if (documentAnalysis === 'completed' || documentAnalysis === 'in_progress') return 2;
          if (fetchPMS === 'completed' || fetchPMS === 'in_progress') return 1;
          return 0;
        };

        const verificationStep = getPatientVerificationStep(patient);
        const matchesAnyStepFilter = stepFilters.some(filter => {
          if (filter === 'Eligibility') return verificationStep >= 1;
          if (filter === 'Verification') return verificationStep >= 3;
          return false;
        });

        if (!matchesAnyStepFilter) return false;
      }

      return true;
    });
  }, [searchQuery, activeFilters]);

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const handleLogout = () => {
    setSelectedPatientId(null);
    setSearchQuery('');
    setActiveFilters([]);
    navigate('/');
  };

  const handleRemoveFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const handleAddFilter = (filter: FilterType) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/b2b-agent/dashboard');
  };

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header */}
      <Header
        onLogoClick={() => navigate('/b2b-agent/dashboard')}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {selectedPatient && (
          <div className="flex w-full">
            <PatientList
              patients={filteredPatients}
              selectedPatientId={selectedPatientId}
              searchQuery={searchQuery}
              activeFilters={activeFilters}
              onSelectPatient={setSelectedPatientId}
              onSearchChange={setSearchQuery}
              onRemoveFilter={handleRemoveFilter}
              onAddFilter={handleAddFilter}
              isAdmin={false}
              onBackToScheduleJobs={handleBackToDashboard}
            />

            <PatientDetail
              patient={selectedPatient}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isAdmin={false}
              onBackToScheduleJobs={handleBackToDashboard}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientDetailPage;
