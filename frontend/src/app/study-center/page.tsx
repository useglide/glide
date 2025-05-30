'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { StudyCenterDashboard } from '../../components/StudyCenterDashboard';

export default function StudyCenterPage() {
  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Study Center" />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <StudyCenterDashboard />
        </div>
      </div>
    </div>
  );
}
