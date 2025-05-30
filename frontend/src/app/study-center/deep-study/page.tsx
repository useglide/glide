'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/Header';
import {
  Focus,
  Target,
  TrendingUp,
  BookOpen,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Lightbulb
} from 'lucide-react';

export default function DeepStudyPage() {
  const router = useRouter();
  const [sessionDuration, setSessionDuration] = useState(90); // 90 minutes default
  const [timeLeft, setTimeLeft] = useState(sessionDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'planning' | 'studying' | 'review'>('planning');
  const [studyGoals, setStudyGoals] = useState<string[]>(['']);
  const [completedGoals, setCompletedGoals] = useState<boolean[]>([false]);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setCurrentPhase('review');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = () => {
    setCurrentPhase('studying');
    setTimeLeft(sessionDuration * 60);
    setIsActive(true);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetSession = () => {
    setIsActive(false);
    setCurrentPhase('planning');
    setTimeLeft(sessionDuration * 60);
  };

  const addGoal = () => {
    setStudyGoals([...studyGoals, '']);
    setCompletedGoals([...completedGoals, false]);
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...studyGoals];
    newGoals[index] = value;
    setStudyGoals(newGoals);
  };

  const toggleGoalCompletion = (index: number) => {
    const newCompleted = [...completedGoals];
    newCompleted[index] = !newCompleted[index];
    setCompletedGoals(newCompleted);
  };

  const removeGoal = (index: number) => {
    if (studyGoals.length > 1) {
      setStudyGoals(studyGoals.filter((_, i) => i !== index));
      setCompletedGoals(completedGoals.filter((_, i) => i !== index));
    }
  };

  const getCompletionRate = () => {
    const completed = completedGoals.filter(Boolean).length;
    return studyGoals.length > 0 ? Math.round((completed / studyGoals.length) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Deep Study" />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--primary-color)] mb-4">
              Deep Study Session
            </h1>
            <p className="text-[var(--secondary-color)] text-lg">
              Intensive, focused study sessions with AI-guided learning paths and progress tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Session Timer */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[var(--primary-color)] flex items-center">
                    <Focus className="w-6 h-6 mr-2" />
                    Study Session
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentPhase === 'planning' ? 'bg-blue-100 text-blue-700' :
                    currentPhase === 'studying' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {currentPhase === 'planning' ? 'Planning' :
                     currentPhase === 'studying' ? 'In Progress' : 'Review'}
                  </span>
                </div>

                <div className="text-center mb-6">
                  <div className="text-5xl font-mono font-bold text-[var(--primary-color)] mb-4">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-[var(--glide-blue)] h-3 rounded-full transition-all duration-1000"
                      style={{
                        width: `${((sessionDuration * 60 - timeLeft) / (sessionDuration * 60)) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  {currentPhase === 'planning' ? (
                    <button
                      onClick={startSession}
                      className="flex items-center px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={studyGoals.every(goal => !goal.trim())}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Deep Study
                    </button>
                  ) : currentPhase === 'studying' ? (
                    <>
                      <button
                        onClick={toggleTimer}
                        className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                          isActive
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-[var(--glide-blue)] hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isActive ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isActive ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => setCurrentPhase('review')}
                        className="flex items-center px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        End Session
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={resetSession}
                      className="flex items-center px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      New Session
                    </button>
                  )}
                </div>
              </div>

              {/* Study Goals */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Study Goals
                </h3>

                <div className="space-y-3 mb-4">
                  {studyGoals.map((goal, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleGoalCompletion(index)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          completedGoals[index]
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {completedGoals[index] && <CheckCircle className="w-3 h-3" />}
                      </button>
                      <input
                        type="text"
                        value={goal}
                        onChange={(e) => updateGoal(index, e.target.value)}
                        placeholder={`Study goal ${index + 1}...`}
                        className={`flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] ${
                          completedGoals[index] ? 'line-through text-gray-500' : ''
                        }`}
                        disabled={currentPhase === 'review'}
                      />
                      {studyGoals.length > 1 && (
                        <button
                          onClick={() => removeGoal(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {currentPhase === 'planning' && (
                  <button
                    onClick={addGoal}
                    className="text-[var(--glide-blue)] hover:text-blue-600 transition-colors text-sm"
                  >
                    + Add another goal
                  </button>
                )}
              </div>

              {/* Session Notes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Session Notes
                </h3>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Take notes during your study session..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Session Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Session Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Duration</span>
                    <span className="font-semibold text-[var(--primary-color)]">{sessionDuration} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Goals Completed</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {completedGoals.filter(Boolean).length}/{studyGoals.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Completion Rate</span>
                    <span className="font-semibold text-[var(--primary-color)]">{getCompletionRate()}%</span>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Session Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                      Session Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={sessionDuration}
                      onChange={(e) => {
                        const newDuration = parseInt(e.target.value) || 90;
                        setSessionDuration(newDuration);
                        if (currentPhase === 'planning') {
                          setTimeLeft(newDuration * 60);
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                      min="15"
                      max="180"
                      disabled={currentPhase === 'studying'}
                    />
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Deep Study Method
                </h3>
                <div className="space-y-3 text-sm text-[var(--secondary-color)]">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Set clear, specific study goals</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Eliminate all distractions</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Focus intensely for extended periods</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Take notes and track progress</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Review and reflect on learning</span>
                  </div>
                </div>
              </div>

              {/* Study Techniques Link */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Explore More Techniques</h3>
                <button
                  onClick={() => router.push('/study-center/study-techniques')}
                  className="w-full px-4 py-2 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  View All Study Techniques
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
