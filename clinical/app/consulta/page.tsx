'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useConsultaStore } from '@/store/consultaStore';
import PatientSelector from '@/components/PatientSelector';
import AppHeader from '@/components/AppHeader';
import ConsultaHeader from '@/components/ConsultaHeader';
import VitalsPanel from '@/components/VitalsPanel';
import PatientHistoryQuick from '@/components/PatientHistoryQuick';
import ConsultaTabs from '@/components/ConsultaTabs';
import ConsultaSummary from '@/components/ConsultaSummary';
import ConsultaFooter from '@/components/ConsultaFooter';
import EvolucionTab from '@/components/EvolucionTab';
import DiagnosticosPanel from '@/components/DiagnosticosPanel';
import OrdenesPanel from '@/components/OrdenesPanel';
import RecetaBuilder from '@/components/RecetaBuilder';

export default function ConsultaPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeTab, paciente, setShowPatientSelector } = useConsultaStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !token) {
      router.push('/');
    }
  }, [isHydrated, token, router]);

  useEffect(() => {
    /* if (isHydrated && token && !paciente) {
      setShowPatientSelector(true);
    } */
  }, [isHydrated, token, paciente, setShowPatientSelector]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'evolucion':
        return <EvolucionTab />;
      case 'diagnosticos':
        return <DiagnosticosPanel />;
      case 'ordenes':
        return <OrdenesPanel />;
      case 'receta':
        return <RecetaBuilder />;
      default:
        return <EvolucionTab />;
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <AppHeader />
      <PatientSelector />

      <div className="grid gap-5 px-5 py-5 lg:px-6">
        <ConsultaHeader />

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_300px] xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <aside className="grid gap-5 content-start order-2 lg:order-1">
            <VitalsPanel />
            <PatientHistoryQuick />
          </aside>

          <main className="order-1 lg:order-2">
            <ConsultaTabs>{renderTabContent()}</ConsultaTabs>
          </main>

          <aside className="order-3">
            <ConsultaSummary />
          </aside>
        </div>

        <ConsultaFooter />
      </div>
    </div>
  );
}
