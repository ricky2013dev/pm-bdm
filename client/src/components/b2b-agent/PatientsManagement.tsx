import React from 'react';
import { useLocation } from 'wouter';
import PatientGuide from './PatientGuide';
import Header from '@/components/Header';
import patientsData from '@mockupdata/patients.json';

const patients = Array.isArray(patientsData) ? patientsData : (patientsData as any).default || [];

const PatientsManagement: React.FC = () => {
  const [, navigate] = useLocation();

  const calculateVerificationStats = () => {
    let verified = 0;
    let inProgress = 0;
    let pending = 0;
    let notStarted = 0;

    patients.forEach(patient => {
      if (!patient.verificationStatus) {
        notStarted++;
        return;
      }

      const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = patient.verificationStatus;

      // Fully verified
      if (saveToPMS === 'completed') {
        verified++;
      }
      // In progress (any step in progress)
      else if (
        fetchPMS === 'in_progress' ||
        documentAnalysis === 'in_progress' ||
        apiVerification === 'in_progress' ||
        callCenter === 'in_progress' ||
        saveToPMS === 'in_progress'
      ) {
        inProgress++;
      }
      // Pending (at least one step completed but not all)
      else if (
        fetchPMS === 'completed' ||
        documentAnalysis === 'completed' ||
        apiVerification === 'completed' ||
        callCenter === 'completed'
      ) {
        pending++;
      }
      // Not started
      else {
        notStarted++;
      }
    });

    return { verified, inProgress, pending, notStarted };
  };

  const verificationStats = calculateVerificationStats();

  const handleHeaderClick = () => {
    navigate('/b2b-agent/dashboard');
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleSelectPatient = (patientId: string) => {
    // Navigate to patient detail page
    navigate(`/b2b-agent/patient-detail?patientId=${patientId}`);
  };

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header */}
      <Header
        onLogoClick={handleHeaderClick}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        <PatientGuide
          totalPatients={patients.length}
          verificationStats={verificationStats}
          patients={patients}
          onSelectPatient={handleSelectPatient}
        />
      </main>
    </div>
  );
};

export default PatientsManagement;
