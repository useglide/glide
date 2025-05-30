'use client';

import React from 'react';
import { Header } from '../../../components/Header';

export default function VideoRecommenderPage() {
  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Video Recommender" />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--primary-color)] mb-8">
            Video Recommender
          </h1>
          {/* Widget content will go here */}
        </div>
      </div>
    </div>
  );
}
