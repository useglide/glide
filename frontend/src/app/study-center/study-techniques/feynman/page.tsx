'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../../components/Header';
import {
  Lightbulb,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  TrendingUp,
  Brain,
  ArrowLeft
} from 'lucide-react';

interface FeynmanSession {
  id: string;
  topic: string;
  step: 1 | 2 | 3 | 4;
  explanation: string;
  simplification: string;
  gaps: string[];
  finalExplanation: string;
  completed: boolean;
  createdAt: Date;
}

export default function FeynmanPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<FeynmanSession[]>([]);
  const [currentSession, setCurrentSession] = useState<FeynmanSession | null>(null);
  const [newTopic, setNewTopic] = useState('');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);

  const createNewSession = () => {
    if (!newTopic.trim()) return;

    const session: FeynmanSession = {
      id: Date.now().toString(),
      topic: newTopic,
      step: 1,
      explanation: '',
      simplification: '',
      gaps: [],
      finalExplanation: '',
      completed: false,
      createdAt: new Date()
    };

    setSessions([...sessions, session]);
    setCurrentSession(session);
    setNewTopic('');
    setShowNewTopicForm(false);
  };

  const updateCurrentSession = (updates: Partial<FeynmanSession>) => {
    if (!currentSession) return;

    const updatedSession = { ...currentSession, ...updates };
    setCurrentSession(updatedSession);

    setSessions(sessions.map(s =>
      s.id === currentSession.id ? updatedSession : s
    ));
  };

  const nextStep = () => {
    if (!currentSession) return;

    if (currentSession.step < 4) {
      updateCurrentSession({ step: (currentSession.step + 1) as 1 | 2 | 3 | 4 });
    } else {
      updateCurrentSession({ completed: true });
    }
  };

  const addGap = (gap: string) => {
    if (!currentSession || !gap.trim()) return;

    const newGaps = [...currentSession.gaps, gap.trim()];
    updateCurrentSession({ gaps: newGaps });
  };

  const removeGap = (index: number) => {
    if (!currentSession) return;

    const newGaps = currentSession.gaps.filter((_, i) => i !== index);
    updateCurrentSession({ gaps: newGaps });
  };

  const resetSession = () => {
    if (!currentSession) return;

    updateCurrentSession({
      step: 1,
      explanation: '',
      simplification: '',
      gaps: [],
      finalExplanation: '',
      completed: false
    });
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Step 1: Explain the Concept';
      case 2: return 'Step 2: Simplify Your Language';
      case 3: return 'Step 3: Identify Knowledge Gaps';
      case 4: return 'Step 4: Review and Refine';
      default: return '';
    }
  };

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return 'Write down everything you know about the topic as if explaining it to someone else.';
      case 2: return 'Rewrite your explanation using simple, everyday language that a child could understand.';
      case 3: return 'Identify areas where your explanation was unclear or where you struggled.';
      case 4: return 'Go back to your source material and create a final, refined explanation.';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Feynman Technique" />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Back to Study Techniques Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/study-center/study-techniques')}
              className="flex items-center px-4 py-2 text-[var(--glide-blue)] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Study Techniques
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--primary-color)] mb-4">
              Feynman Technique
            </h1>
            <p className="text-[var(--secondary-color)] text-lg">
              Learn by teaching. Explain concepts in simple terms to identify knowledge gaps and deepen understanding.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {currentSession ? (
                <div className="space-y-6">
                  {/* Progress Header */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-[var(--primary-color)]">
                        {currentSession.topic}
                      </h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-[var(--secondary-color)]">
                          Step {currentSession.step} of 4
                        </span>
                        <button
                          onClick={resetSession}
                          className="text-[var(--secondary-color)] hover:text-[var(--primary-color)] transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-[var(--glide-blue)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentSession.step / 4) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-[var(--secondary-color)]">
                      <Lightbulb className="w-4 h-4" />
                      <span>{getStepTitle(currentSession.step)}</span>
                    </div>
                  </div>

                  {/* Current Step Content */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-2">
                      {getStepTitle(currentSession.step)}
                    </h3>
                    <p className="text-[var(--secondary-color)] mb-6">
                      {getStepDescription(currentSession.step)}
                    </p>

                    {currentSession.step === 1 && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Your Initial Explanation
                        </label>
                        <textarea
                          value={currentSession.explanation}
                          onChange={(e) => updateCurrentSession({ explanation: e.target.value })}
                          placeholder="Explain the concept in your own words. Don't worry about being perfect - just write down everything you know..."
                          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                        />
                      </div>
                    )}

                    {currentSession.step === 2 && (
                      <div>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-[var(--primary-color)] mb-2">Your Original Explanation:</h4>
                          <p className="text-sm text-[var(--secondary-color)]">
                            {currentSession.explanation || 'No explanation provided in Step 1'}
                          </p>
                        </div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Simplified Explanation (Use Simple Language)
                        </label>
                        <textarea
                          value={currentSession.simplification}
                          onChange={(e) => updateCurrentSession({ simplification: e.target.value })}
                          placeholder="Rewrite your explanation using simple words that a child could understand. Avoid jargon and technical terms..."
                          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                        />
                      </div>
                    )}

                    {currentSession.step === 3 && (
                      <div>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-[var(--primary-color)] mb-2">Your Simplified Explanation:</h4>
                          <p className="text-sm text-[var(--secondary-color)]">
                            {currentSession.simplification || 'No simplified explanation provided in Step 2'}
                          </p>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                            Knowledge Gaps Identified
                          </label>
                          <div className="space-y-2 mb-4">
                            {currentSession.gaps.map((gap, index) => (
                              <div key={index} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                                <span className="text-sm text-red-700">{gap}</span>
                                <button
                                  onClick={() => removeGap(index)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="What concepts were unclear or missing?"
                              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addGap(e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            <button
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                addGap(input.value);
                                input.value = '';
                              }}
                              className="px-4 py-2 bg-[var(--glide-blue)] text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                              Add Gap
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentSession.step === 4 && (
                      <div>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-[var(--primary-color)] mb-2">Knowledge Gaps to Address:</h4>
                          {currentSession.gaps.length > 0 ? (
                            <ul className="text-sm text-[var(--secondary-color)] space-y-1">
                              {currentSession.gaps.map((gap, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                  {gap}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-[var(--secondary-color)]">No gaps identified</p>
                          )}
                        </div>

                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Final Refined Explanation
                        </label>
                        <textarea
                          value={currentSession.finalExplanation}
                          onChange={(e) => updateCurrentSession({ finalExplanation: e.target.value })}
                          placeholder="After reviewing your source material and addressing the gaps, write your final, polished explanation..."
                          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                        />
                      </div>
                    )}

                    <div className="flex justify-between mt-6">
                      <button
                        onClick={() => setCurrentSession(null)}
                        className="px-4 py-2 text-[var(--secondary-color)] hover:text-[var(--primary-color)] transition-colors"
                      >
                        Back to Sessions
                      </button>

                      {!currentSession.completed && (
                        <button
                          onClick={nextStep}
                          className="flex items-center px-6 py-2 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                          disabled={
                            (currentSession.step === 1 && !currentSession.explanation.trim()) ||
                            (currentSession.step === 2 && !currentSession.simplification.trim()) ||
                            (currentSession.step === 4 && !currentSession.finalExplanation.trim())
                          }
                        >
                          {currentSession.step === 4 ? 'Complete Session' : 'Next Step'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                      )}

                      {currentSession.completed && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">Session Completed!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* New Topic Form */}
                  {showNewTopicForm ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h2 className="text-xl font-semibold text-[var(--primary-color)] mb-4">Start New Feynman Session</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                            What topic would you like to learn?
                          </label>
                          <input
                            type="text"
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            placeholder="e.g., Photosynthesis, Quantum Physics, Machine Learning..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            onClick={createNewSession}
                            className="px-6 py-2 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                            disabled={!newTopic.trim()}
                          >
                            Start Session
                          </button>
                          <button
                            onClick={() => setShowNewTopicForm(false)}
                            className="px-6 py-2 text-[var(--secondary-color)] hover:text-[var(--primary-color)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                      <Lightbulb className="w-16 h-16 mx-auto text-[var(--glide-blue)] mb-4" />
                      <h2 className="text-xl font-semibold text-[var(--primary-color)] mb-2">
                        Ready to Learn Something New?
                      </h2>
                      <p className="text-[var(--secondary-color)] mb-6">
                        The Feynman Technique helps you learn by teaching. Start by choosing a topic you want to understand better.
                      </p>
                      <button
                        onClick={() => setShowNewTopicForm(true)}
                        className="px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Start New Session
                      </button>
                    </div>
                  )}

                  {/* Previous Sessions */}
                  {sessions.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Previous Sessions</h3>
                      <div className="space-y-3">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[var(--glide-blue)] transition-colors cursor-pointer"
                            onClick={() => setCurrentSession(session)}
                          >
                            <div>
                              <h4 className="font-medium text-[var(--primary-color)]">{session.topic}</h4>
                              <p className="text-sm text-[var(--secondary-color)]">
                                {session.completed ? 'Completed' : `Step ${session.step} of 4`} •
                                {session.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {session.completed && <CheckCircle className="w-5 h-5 text-green-500 mr-2" />}
                              <ArrowRight className="w-4 h-4 text-[var(--secondary-color)]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Your Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Total Sessions</span>
                    <span className="font-semibold text-[var(--primary-color)]">{sessions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Completed</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {sessions.filter(s => s.completed).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">In Progress</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {sessions.filter(s => !s.completed).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  The 4 Steps
                </h3>
                <div className="space-y-3 text-sm text-[var(--secondary-color)]">
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-[var(--glide-blue)] text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                    <span>Explain the concept in your own words</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-[var(--glide-blue)] text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                    <span>Simplify using everyday language</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-[var(--glide-blue)] text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                    <span>Identify knowledge gaps</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-[var(--glide-blue)] text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                    <span>Review and refine your explanation</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Benefits</h3>
                <ul className="space-y-2 text-sm text-[var(--secondary-color)]">
                  <li>• Identifies knowledge gaps clearly</li>
                  <li>• Improves understanding through teaching</li>
                  <li>• Simplifies complex concepts</li>
                  <li>• Builds confidence in your knowledge</li>
                  <li>• Enhances communication skills</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
