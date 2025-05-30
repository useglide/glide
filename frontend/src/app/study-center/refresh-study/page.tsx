'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/Header';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  BookOpen,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

interface StudyTopic {
  id: string;
  title: string;
  subject: string;
  lastStudied: Date;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reviewCount: number;
  confidence: number; // 1-5 scale
}

export default function RefreshStudyPage() {
  const router = useRouter();
  const sessionDuration = 15; // 15 minutes default for refresh
  const [timeLeft, setTimeLeft] = useState(sessionDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');

  const [studyTopics] = useState<StudyTopic[]>([
    {
      id: '1',
      title: 'Photosynthesis Process',
      subject: 'Biology',
      lastStudied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      difficulty: 'Medium',
      reviewCount: 2,
      confidence: 3
    },
    {
      id: '2',
      title: 'Quadratic Equations',
      subject: 'Mathematics',
      lastStudied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      difficulty: 'Hard',
      reviewCount: 4,
      confidence: 2
    },
    {
      id: '3',
      title: 'French Revolution Timeline',
      subject: 'History',
      lastStudied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      difficulty: 'Easy',
      reviewCount: 1,
      confidence: 4
    },
    {
      id: '4',
      title: 'Chemical Bonding',
      subject: 'Chemistry',
      lastStudied: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      difficulty: 'Medium',
      reviewCount: 3,
      confidence: 3
    }
  ]);

  // Sort topics by priority (least confident and longest since last studied first)
  const prioritizedTopics = [...studyTopics].sort((a, b) => {
    const aScore = a.confidence + (Date.now() - a.lastStudied.getTime()) / (24 * 60 * 60 * 1000);
    const bScore = b.confidence + (Date.now() - b.lastStudied.getTime()) / (24 * 60 * 60 * 1000);
    return aScore - bScore;
  });

  const currentTopic = prioritizedTopics[currentTopicIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(sessionDuration * 60);
  };

  const markTopicCompleted = () => {
    if (currentTopic && !completedTopics.includes(currentTopic.id)) {
      setCompletedTopics([...completedTopics, currentTopic.id]);
    }

    if (currentTopicIndex < prioritizedTopics.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
    } else {
      setCurrentTopicIndex(0);
    }
  };

  const skipTopic = () => {
    if (currentTopicIndex < prioritizedTopics.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
    } else {
      setCurrentTopicIndex(0);
    }
  };

  const getDaysSinceLastStudied = (date: Date) => {
    return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence <= 2) return 'text-red-600 bg-red-100';
    if (confidence <= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Refresh Study" />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--primary-color)] mb-4">
              Refresh Study
            </h1>
            <p className="text-[var(--secondary-color)] text-lg">
              Quick review sessions to reinforce previously learned material and maintain knowledge retention.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timer Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[var(--primary-color)] flex items-center">
                    <RefreshCw className="w-6 h-6 mr-2" />
                    Quick Review Session
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[var(--secondary-color)]" />
                    <span className="text-sm text-[var(--secondary-color)]">{sessionDuration} min session</span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-mono font-bold text-[var(--primary-color)] mb-4">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[var(--glide-blue)] h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${((sessionDuration * 60 - timeLeft) / (sessionDuration * 60)) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={toggleTimer}
                    className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-[var(--glide-blue)] hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isActive ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    {isActive ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="flex items-center px-6 py-3 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Current Topic */}
              {currentTopic && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--primary-color)] flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Current Topic
                    </h3>
                    <span className="text-sm text-[var(--secondary-color)]">
                      {currentTopicIndex + 1} of {prioritizedTopics.length}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="text-xl font-medium text-[var(--primary-color)] mb-2">
                      {currentTopic.title}
                    </h4>
                    <p className="text-[var(--secondary-color)] mb-4">{currentTopic.subject}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentTopic.difficulty)}`}>
                        {currentTopic.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(currentTopic.confidence)}`}>
                        Confidence: {currentTopic.confidence}/5
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Last studied: {getDaysSinceLastStudied(currentTopic.lastStudied)} days ago
                      </span>
                    </div>

                    <div className="text-sm text-[var(--secondary-color)]">
                      <p className="mb-2">
                        <strong>Review Focus:</strong> Spend 3-5 minutes reviewing key concepts, formulas, or facts.
                      </p>
                      <p>
                        <strong>Quick Test:</strong> Try to recall main points without looking at notes first.
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={markTopicCompleted}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed Review
                    </button>
                    <button
                      onClick={skipTopic}
                      className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Skip for Now
                    </button>
                  </div>
                </div>
              )}

              {/* Session Notes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Quick Notes
                </h3>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Jot down any insights, questions, or areas that need more review..."
                  className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Session Progress */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Session Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Topics Reviewed</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {completedTopics.length}/{prioritizedTopics.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Session Time</span>
                    <span className="font-semibold text-[var(--primary-color)]">{sessionDuration} min</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(completedTopics.length / prioritizedTopics.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Topics Queue */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Review Queue</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {prioritizedTopics.map((topic, index) => (
                    <div
                      key={topic.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        index === currentTopicIndex
                          ? 'border-[var(--glide-blue)] bg-blue-50'
                          : completedTopics.includes(topic.id)
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm text-[var(--primary-color)]">{topic.title}</h4>
                          <p className="text-xs text-[var(--secondary-color)]">{topic.subject}</p>
                        </div>
                        {completedTopics.includes(topic.id) && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Refresh Study Method
                </h3>
                <div className="space-y-3 text-sm text-[var(--secondary-color)]">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Quick 3-5 minute reviews per topic</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Focus on previously learned material</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Prioritizes topics by confidence and recency</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Maintains knowledge retention</span>
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
