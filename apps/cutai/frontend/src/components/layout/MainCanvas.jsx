import React from 'react';
import useUIStore from '../../stores/useUIStore';

export default function MainCanvas({ children }) {
  const { shotPanelOpen, closeShotPanel } = useUIStore();

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-cutai-bg">
      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 ${shotPanelOpen ? 'mr-0 md:mr-[28rem]' : ''}`}
      >
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
