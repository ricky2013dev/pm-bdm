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

      const { eligibilityCheck, benefitsVerification, aiCallVerification, sendToPMS } = patient.verificationStatus;

      // Fully verified
      if (sendToPMS === 'completed') {
        verified++;
      }
      // In progress (any step in progress)
      else if (
        eligibilityCheck === 'in_progress' ||
        benefitsVerification === 'in_progress' ||
        aiCallVerification === 'in_progress' ||
        sendToPMS === 'in_progress'
      ) {
        inProgress++;
      }
      // Pending (at least one step completed but not all)
      else if (
        eligibilityCheck === 'completed' ||
        benefitsVerification === 'completed' ||
        aiCallVerification === 'completed'
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
