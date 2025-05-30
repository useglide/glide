'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../../components/Header';
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';

interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  subject: string;
  color: string;
  completed: boolean;
}

export default function TimeBlockingPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<TimeBlock[]>([
    {
      id: '1',
      title: 'Math Study Session',
      startTime: '09:00',
      endTime: '10:30',
      subject: 'Mathematics',
      color: '#3b82f6',
      completed: false
    },
    {
      id: '2',
      title: 'History Reading',
      startTime: '11:00',
      endTime: '12:00',
      subject: 'History',
      color: '#10b981',
      completed: true
    }
  ]);

  const [newBlock, setNewBlock] = useState({
    title: '',
    startTime: '',
    endTime: '',
    subject: '',
    color: '#3b82f6'
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const addBlock = () => {
    if (newBlock.title.trim() && newBlock.startTime && newBlock.endTime) {
      const block: TimeBlock = {
        id: Date.now().toString(),
        title: newBlock.title,
        startTime: newBlock.startTime,
        endTime: newBlock.endTime,
        subject: newBlock.subject,
        color: newBlock.color,
        completed: false
      };
      setBlocks([...blocks, block]);
      setNewBlock({ title: '', startTime: '', endTime: '', subject: '', color: '#3b82f6' });
      setShowAddForm(false);
    }
  };

  const toggleComplete = (id: string) => {
    setBlocks(blocks.map(block =>
      block.id === id ? { ...block, completed: !block.completed } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
  };

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Time Blocking" />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Add Block Form */}
                {showAddForm ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-[var(--primary-color)] mb-4">Create Time Block</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={newBlock.title}
                          onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                          placeholder="e.g., Math Study Session"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={newBlock.startTime}
                            onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={newBlock.endTime}
                            onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={newBlock.subject}
                          onChange={(e) => setNewBlock({ ...newBlock, subject: e.target.value })}
                          placeholder="e.g., Mathematics"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                        />
                      </div>

                      <div className="flex space-x-4">
                        <button
                          onClick={addBlock}
                          className="px-6 py-2 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Add Block
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="px-6 py-2 text-[var(--secondary-color)] hover:text-[var(--primary-color)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-[var(--primary-color)]">Today&apos;s Schedule</h2>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center px-4 py-2 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Block
                      </button>
                    </div>

                    {blocks.length > 0 ? (
                      <div className="space-y-3">
                        {blocks.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((block) => (
                          <div
                            key={block.id}
                            className={`border rounded-lg p-4 transition-all ${
                              block.completed ? 'bg-green-50 border-green-200' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: block.color }}
                                />
                                <div>
                                  <h3 className={`font-medium ${
                                    block.completed ? 'text-green-700 line-through' : 'text-[var(--primary-color)]'
                                  }`}>
                                    {block.title}
                                  </h3>
                                  <p className="text-sm text-[var(--secondary-color)]">
                                    {block.startTime} - {block.endTime} • {block.subject}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => toggleComplete(block.id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    block.completed
                                      ? 'text-green-600 hover:text-green-700'
                                      : 'text-gray-400 hover:text-green-600'
                                  }`}
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => deleteBlock(block.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-[var(--primary-color)] mb-2">No Time Blocks Yet</h3>
                        <p className="text-[var(--secondary-color)] mb-4">
                          Create time blocks to organize your study schedule.
                        </p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Create First Block
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Today&apos;s Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Total Blocks</span>
                    <span className="font-semibold text-[var(--primary-color)]">{blocks.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Completed</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {blocks.filter(b => b.completed).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Completion Rate</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {blocks.length > 0 ? Math.round((blocks.filter(b => b.completed).length / blocks.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  How Time Blocking Works
                </h3>
                <div className="space-y-3 text-sm text-[var(--secondary-color)]">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Schedule specific time slots for different subjects</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Eliminate decision fatigue about what to study</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Create boundaries between different activities</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Track your actual time usage</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Benefits</h3>
                <ul className="space-y-2 text-sm text-[var(--secondary-color)]">
                  <li>• Improves time management</li>
                  <li>• Reduces procrastination</li>
                  <li>• Increases productivity</li>
                  <li>• Better work-life balance</li>
                  <li>• Clearer daily structure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
