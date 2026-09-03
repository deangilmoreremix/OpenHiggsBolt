'use client';

import React from 'react';
import { useSmartVideoAccess } from './SmartVideoAccessProvider';

export function PaidAction({
  entitlement,
  onAllowed,
  children,
  className = '',
}: {
  entitlement: string;
  onAllowed: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const { isPaid, requireEntitlement } = useSmartVideoAccess();

  const handleClick = () => {
    requireEntitlement(entitlement, onAllowed);
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
