'use client';

import React from 'react';
import { Header } from '../../components/Header';
import Calendar from '../../components/Calendar';

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Calendar" />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">

          {/* Calendar component */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Calendar />
          </div>
        </div>
      </div>
    </div>
  );
}
