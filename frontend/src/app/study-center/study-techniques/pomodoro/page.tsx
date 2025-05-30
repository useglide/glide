'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../../components/Header';
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Coffee,
  CheckCircle,
  Settings,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';

export default function PomodoroPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      if (isBreak) {
        // Break finished, start new work session
        setIsBreak(false);
        setTimeLeft(workDuration * 60);
        setIsActive(false);
      } else {
        // Work session finished
        setCompletedPomodoros(prev => prev + 1);
        const isLongBreak = (completedPomodoros + 1) % 4 === 0;
        setIsBreak(true);
        setTimeLeft((isLongBreak ? longBreakDuration : shortBreakDuration) * 60);
        setIsActive(false);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, isBreak, completedPomodoros, workDuration, shortBreakDuration, longBreakDuration]);

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
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
  };

  const updateSettings = () => {
    if (!isActive) {
      setTimeLeft(workDuration * 60);
      setIsBreak(false);
    }
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Pomodoro Technique" />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timer Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[var(--primary-color)] mb-2">
                    {isBreak ? 'Break Time' : 'Focus Time'}
                  </h2>
                  <div className="flex items-center justify-center text-[var(--secondary-color)]">
                    {isBreak ? <Coffee className="w-5 h-5 mr-2" /> : <Timer className="w-5 h-5 mr-2" />}
                    <span>
                      {isBreak
                        ? (completedPomodoros % 4 === 0 ? 'Long Break' : 'Short Break')
                        : `Pomodoro ${completedPomodoros + 1}`
                      }
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="text-6xl font-mono font-bold text-[var(--primary-color)] mb-4">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        isBreak ? 'bg-green-500' : 'bg-[var(--glide-blue)]'
                      }`}
                      style={{
                        width: `${((isBreak
                          ? (completedPomodoros % 4 === 0 ? longBreakDuration : shortBreakDuration) * 60
                          : workDuration * 60) - timeLeft) /
                          (isBreak
                            ? (completedPomodoros % 4 === 0 ? longBreakDuration : shortBreakDuration) * 60
                            : workDuration * 60) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-center space-x-4 mb-6">
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
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center px-6 py-3 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-[var(--primary-color)] transition-colors"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Settings
                  </button>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                  <div className="bg-gray-50 rounded-lg p-6 text-left">
                    <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Timer Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Work Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={workDuration}
                          onChange={(e) => setWorkDuration(parseInt(e.target.value) || 25)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                          min="1"
                          max="60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Short Break (minutes)
                        </label>
                        <input
                          type="number"
                          value={shortBreakDuration}
                          onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 5)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                          min="1"
                          max="30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Long Break (minutes)
                        </label>
                        <input
                          type="number"
                          value={longBreakDuration}
                          onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 15)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                    <button
                      onClick={updateSettings}
                      className="mt-4 px-4 py-2 bg-[var(--glide-blue)] text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Apply Settings
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info and Stats Section */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Today&apos;s Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Completed Pomodoros</span>
                    <span className="font-semibold text-[var(--primary-color)]">{completedPomodoros}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Focus Time</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {Math.floor(completedPomodoros * workDuration / 60)}h {(completedPomodoros * workDuration) % 60}m
                    </span>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">How it Works</h3>
                <div className="space-y-3 text-sm text-[var(--secondary-color)]">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Work for 25 minutes with complete focus</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Take a 5-minute break</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>After 4 pomodoros, take a 15-30 minute break</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Repeat the cycle throughout your study session</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Benefits</h3>
                <ul className="space-y-2 text-sm text-[var(--secondary-color)]">
                  <li>• Improves focus and concentration</li>
                  <li>• Reduces mental fatigue</li>
                  <li>• Increases productivity</li>
                  <li>• Helps manage time effectively</li>
                  <li>• Reduces procrastination</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
