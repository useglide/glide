'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../../components/Header';
import {
  Brain,
  CheckCircle,
  X,
  Plus,
  Trash2,
  TrendingUp,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  lastReviewed: Date;
  correctCount: number;
  totalAttempts: number;
}

export default function ActiveRecallPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      question: 'What is the capital of France?',
      answer: 'Paris',
      difficulty: 'Easy',
      lastReviewed: new Date(),
      correctCount: 3,
      totalAttempts: 4
    },
    {
      id: '2',
      question: 'Explain the concept of photosynthesis',
      answer: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.',
      difficulty: 'Medium',
      lastReviewed: new Date(),
      correctCount: 2,
      totalAttempts: 3
    }
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState<{ question: string; answer: string; difficulty: 'Easy' | 'Medium' | 'Hard' }>({ question: '', answer: '', difficulty: 'Medium' });
  const [studyMode, setStudyMode] = useState<'practice' | 'create'>('practice');

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (currentQuestion) {
      const updatedQuestions = questions.map(q =>
        q.id === currentQuestion.id
          ? {
              ...q,
              totalAttempts: q.totalAttempts + 1,
              correctCount: isCorrect ? q.correctCount + 1 : q.correctCount,
              lastReviewed: new Date()
            }
          : q
      );
      setQuestions(updatedQuestions);
    }

    setShowAnswer(false);
    setUserAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentQuestionIndex(0);
    }
  };

  const addQuestion = () => {
    if (newQuestion.question.trim() && newQuestion.answer.trim()) {
      const question: Question = {
        id: Date.now().toString(),
        question: newQuestion.question,
        answer: newQuestion.answer,
        difficulty: newQuestion.difficulty,
        lastReviewed: new Date(),
        correctCount: 0,
        totalAttempts: 0
      };
      setQuestions([...questions, question]);
      setNewQuestion({ question: '', answer: '', difficulty: 'Medium' });
    }
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (currentQuestionIndex >= questions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, questions.length - 2));
    }
  };

  const getAccuracyRate = () => {
    const totalAttempts = questions.reduce((sum, q) => sum + q.totalAttempts, 0);
    const totalCorrect = questions.reduce((sum, q) => sum + q.correctCount, 0);
    return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Active Recall" />
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

          {/* Mode Toggle */}
          <div className="mb-6">
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-fit">
              <button
                onClick={() => setStudyMode('practice')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  studyMode === 'practice'
                    ? 'bg-[var(--glide-blue)] text-white'
                    : 'text-[var(--secondary-color)] hover:text-[var(--primary-color)]'
                }`}
              >
                Practice Mode
              </button>
              <button
                onClick={() => setStudyMode('create')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  studyMode === 'create'
                    ? 'bg-[var(--glide-blue)] text-white'
                    : 'text-[var(--secondary-color)] hover:text-[var(--primary-color)]'
                }`}
              >
                Create Questions
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {studyMode === 'practice' ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  {questions.length > 0 ? (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-semibold text-[var(--primary-color)]">
                            Question {currentQuestionIndex + 1} of {questions.length}
                          </h2>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            currentQuestion?.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            currentQuestion?.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {currentQuestion?.difficulty}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-[var(--glide-blue)] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-[var(--primary-color)] mb-4">
                          {currentQuestion?.question}
                        </h3>

                        <textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                        />
                      </div>

                      <div className="flex space-x-4 mb-6">
                        <button
                          onClick={() => setShowAnswer(!showAnswer)}
                          className="px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          {showAnswer ? 'Hide Answer' : 'Show Answer'}
                        </button>
                      </div>

                      {showAnswer && (
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                          <h4 className="font-medium text-[var(--primary-color)] mb-2">Correct Answer:</h4>
                          <p className="text-[var(--secondary-color)] mb-4">{currentQuestion?.answer}</p>

                          <div className="flex space-x-4">
                            <button
                              onClick={() => handleAnswerSubmit(true)}
                              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              I got it right
                            </button>
                            <button
                              onClick={() => handleAnswerSubmit(false)}
                              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4 mr-2" />
                              I got it wrong
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-[var(--primary-color)] mb-2">No Questions Yet</h3>
                      <p className="text-[var(--secondary-color)] mb-4">
                        Create some questions to start practicing active recall.
                      </p>
                      <button
                        onClick={() => setStudyMode('create')}
                        className="px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Create Questions
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Add Question Form */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-[var(--primary-color)] mb-4">Create New Question</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Question
                        </label>
                        <textarea
                          value={newQuestion.question}
                          onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                          placeholder="Enter your question..."
                          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Answer
                        </label>
                        <textarea
                          value={newQuestion.answer}
                          onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                          placeholder="Enter the correct answer..."
                          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Difficulty
                        </label>
                        <select
                          value={newQuestion.difficulty}
                          onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <button
                        onClick={addQuestion}
                        className="flex items-center px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </button>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Your Questions</h3>

                    {questions.length > 0 ? (
                      <div className="space-y-4">
                        {questions.map((question) => (
                          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-[var(--primary-color)] mb-2">
                                  {question.question}
                                </h4>
                                <p className="text-sm text-[var(--secondary-color)] mb-2">
                                  {question.answer}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-[var(--secondary-color)]">
                                  <span className={`px-2 py-1 rounded-full ${
                                    question.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                    question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {question.difficulty}
                                  </span>
                                  <span>
                                    Accuracy: {question.totalAttempts > 0 ? Math.round((question.correctCount / question.totalAttempts) * 100) : 0}%
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteQuestion(question.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--secondary-color)] text-center py-8">
                        No questions created yet. Add your first question above.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Your Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Total Questions</span>
                    <span className="font-semibold text-[var(--primary-color)]">{questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Overall Accuracy</span>
                    <span className="font-semibold text-[var(--primary-color)]">{getAccuracyRate()}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Total Attempts</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {questions.reduce((sum, q) => sum + q.totalAttempts, 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  How Active Recall Works
                </h3>
                <div className="space-y-3 text-sm text-[var(--secondary-color)]">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Create questions from your study material</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Try to answer without looking at notes</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Check your answer and mark accuracy</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Focus more on questions you get wrong</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Benefits</h3>
                <ul className="space-y-2 text-sm text-[var(--secondary-color)]">
                  <li>• Strengthens memory retrieval</li>
                  <li>• Identifies knowledge gaps</li>
                  <li>• Improves long-term retention</li>
                  <li>• More effective than passive reading</li>
                  <li>• Builds confidence for exams</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
