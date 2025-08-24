import React from 'react';

// Minimal layout for Tuono API-only mode
// This file is required by Tuono's route generation but won't be used for client routing

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}