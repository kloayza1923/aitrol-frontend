'use client';

import { useConsultaStore } from '@/store/consultaStore';

type TabId = 'evolucion' | 'diagnosticos' | 'ordenes' | 'receta';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'evolucion',
    label: 'Evolucion',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'diagnosticos',
    label: 'Diagnosticos',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'ordenes',
    label: 'Ordenes',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    id: 'receta',
    label: 'Receta',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

interface ConsultaTabsProps {
  children: React.ReactNode;
}

export default function ConsultaTabs({ children }: ConsultaTabsProps) {
  const { activeTab, setActiveTab, diagnosticos, recetaItems, ordenesLab, ordenesRx } = useConsultaStore();

  const getCounts = (tabId: TabId) => {
    switch (tabId) {
      case 'diagnosticos':
        return diagnosticos.length;
      case 'receta':
        return recetaItems.length;
      case 'ordenes':
        return ordenesLab.length + ordenesRx.length;
      default:
        return 0;
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-panel shadow-panel overflow-hidden animate-rise">
      <div className="flex border-b border-white/10 bg-panel-2">
        {tabs.map((tab) => {
          const count = getCounts(tab.id);
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                isActive
                  ? 'text-accent bg-white/5'
                  : 'text-muted hover:text-ink-contrast hover:bg-white/5'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-accent text-[#041b14]' : 'bg-white/10 text-muted'
                  }`}>
                    {count}
                  </span>
                )}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-5 min-h-[400px]">
        {children}
      </div>
    </div>
  );
}
