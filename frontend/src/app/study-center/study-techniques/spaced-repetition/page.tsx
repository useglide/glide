'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../../components/Header';
import {
  Repeat,
  CheckCircle,
  TrendingUp,
  Plus,
  Trash2,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';

interface SpacedCard {
  id: string;
  front: string;
  back: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  interval: number; // days until next review
  nextReview: Date;
  reviewCount: number;
  easeFactor: number; // SM-2 algorithm ease factor
}

export default function SpacedRepetitionPage() {
  const router = useRouter();
  const [cards, setCards] = useState<SpacedCard[]>([
    {
      id: '1',
      front: 'What is the formula for photosynthesis?',
      back: '6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂',
      difficulty: 'Medium',
      interval: 1,
      nextReview: new Date(),
      reviewCount: 0,
      easeFactor: 2.5
    },
    {
      id: '2',
      front: 'Define mitochondria',
      back: 'The powerhouse of the cell, responsible for producing ATP through cellular respiration',
      difficulty: 'Easy',
      interval: 3,
      nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      reviewCount: 2,
      easeFactor: 2.8
    }
  ]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newCard, setNewCard] = useState<{ front: string; back: string; difficulty: 'Easy' | 'Medium' | 'Hard' }>({ front: '', back: '', difficulty: 'Medium' });
  const [studyMode, setStudyMode] = useState<'review' | 'create'>('review');

  // Get cards due for review today
  const dueCards = cards.filter(card => card.nextReview <= new Date());
  const currentCard = dueCards[currentCardIndex];

  const calculateNextInterval = (card: SpacedCard, quality: number) => {
    // SM-2 Algorithm implementation
    let newEaseFactor = card.easeFactor;
    let newInterval = card.interval;

    if (quality >= 3) {
      if (card.reviewCount === 0) {
        newInterval = 1;
      } else if (card.reviewCount === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(card.interval * newEaseFactor);
      }
    } else {
      newInterval = 1;
    }

    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;

    return { newInterval, newEaseFactor };
  };

  const handleCardReview = (quality: number) => {
    if (!currentCard) return;

    const { newInterval, newEaseFactor } = calculateNextInterval(currentCard, quality);
    const nextReview = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

    const updatedCards = cards.map(card =>
      card.id === currentCard.id
        ? {
            ...card,
            interval: newInterval,
            nextReview,
            reviewCount: card.reviewCount + 1,
            easeFactor: newEaseFactor
          }
        : card
    );

    setCards(updatedCards);
    setShowAnswer(false);

    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentCardIndex(0);
    }
  };

  const addCard = () => {
    if (newCard.front.trim() && newCard.back.trim()) {
      const card: SpacedCard = {
        id: Date.now().toString(),
        front: newCard.front,
        back: newCard.back,
        difficulty: newCard.difficulty,
        interval: 1,
        nextReview: new Date(),
        reviewCount: 0,
        easeFactor: 2.5
      };
      setCards([...cards, card]);
      setNewCard({ front: '', back: '', difficulty: 'Medium' });
    }
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id));
    if (currentCardIndex >= dueCards.length - 1) {
      setCurrentCardIndex(Math.max(0, dueCards.length - 2));
    }
  };

  const getQualityDescription = (quality: number) => {
    switch (quality) {
      case 5: return 'Perfect recall';
      case 4: return 'Correct with hesitation';
      case 3: return 'Correct with difficulty';
      case 2: return 'Incorrect but remembered';
      case 1: return 'Incorrect, familiar';
      case 0: return 'Complete blackout';
      default: return '';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Spaced Repetition" />
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
                onClick={() => setStudyMode('review')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  studyMode === 'review'
                    ? 'bg-[var(--glide-blue)] text-white'
                    : 'text-[var(--secondary-color)] hover:text-[var(--primary-color)]'
                }`}
              >
                Review Cards
              </button>
              <button
                onClick={() => setStudyMode('create')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  studyMode === 'create'
                    ? 'bg-[var(--glide-blue)] text-white'
                    : 'text-[var(--secondary-color)] hover:text-[var(--primary-color)]'
                }`}
              >
                Manage Cards
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {studyMode === 'review' ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  {dueCards.length > 0 ? (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-semibold text-[var(--primary-color)]">
                            Card {currentCardIndex + 1} of {dueCards.length}
                          </h2>
                          <div className="flex items-center space-x-2 text-sm text-[var(--secondary-color)]">
                            <Repeat className="w-4 h-4" />
                            <span>Review #{currentCard?.reviewCount || 0}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-[var(--glide-blue)] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentCardIndex + 1) / dueCards.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="mb-8">
                        <div className="bg-gray-50 rounded-lg p-6 mb-6 min-h-[120px] flex items-center justify-center">
                          <h3 className="text-lg font-medium text-[var(--primary-color)] text-center">
                            {currentCard?.front}
                          </h3>
                        </div>

                        <div className="text-center mb-6">
                          <button
                            onClick={() => setShowAnswer(!showAnswer)}
                            className="px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            {showAnswer ? 'Hide Answer' : 'Show Answer'}
                          </button>
                        </div>

                        {showAnswer && (
                          <div className="space-y-6">
                            <div className="bg-blue-50 rounded-lg p-6">
                              <h4 className="font-medium text-[var(--primary-color)] mb-2">Answer:</h4>
                              <p className="text-[var(--secondary-color)]">{currentCard?.back}</p>
                            </div>

                            <div>
                              <h4 className="font-medium text-[var(--primary-color)] mb-4">How well did you remember?</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[0, 1, 2, 3, 4, 5].map(quality => (
                                  <button
                                    key={quality}
                                    onClick={() => handleCardReview(quality)}
                                    className={`p-3 rounded-lg border-2 transition-colors text-sm ${
                                      quality >= 3
                                        ? 'border-green-200 hover:border-green-400 hover:bg-green-50'
                                        : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                                    }`}
                                  >
                                    <div className="font-medium">{quality}</div>
                                    <div className="text-xs text-[var(--secondary-color)]">
                                      {getQualityDescription(quality)}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-medium text-[var(--primary-color)] mb-2">All caught up!</h3>
                      <p className="text-[var(--secondary-color)] mb-4">
                        No cards are due for review today. Great job staying on top of your studies!
                      </p>
                      <button
                        onClick={() => setStudyMode('create')}
                        className="px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Add More Cards
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Add Card Form */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-[var(--primary-color)] mb-4">Create New Card</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Front (Question)
                        </label>
                        <textarea
                          value={newCard.front}
                          onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                          placeholder="Enter your question or prompt..."
                          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Back (Answer)
                        </label>
                        <textarea
                          value={newCard.back}
                          onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                          placeholder="Enter the answer..."
                          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--secondary-color)] mb-2">
                          Initial Difficulty
                        </label>
                        <select
                          value={newCard.difficulty}
                          onChange={(e) => setNewCard({ ...newCard, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glide-blue)]"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <button
                        onClick={addCard}
                        className="flex items-center px-6 py-3 bg-[var(--glide-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Card
                      </button>
                    </div>
                  </div>

                  {/* Cards List */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Your Cards</h3>

                    {cards.length > 0 ? (
                      <div className="space-y-4">
                        {cards.map((card) => (
                          <div key={card.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-[var(--primary-color)] mb-1">
                                  {card.front}
                                </h4>
                                <p className="text-sm text-[var(--secondary-color)] mb-2">
                                  {card.back}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-[var(--secondary-color)]">
                                  <span className={`px-2 py-1 rounded-full ${
                                    card.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                    card.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {card.difficulty}
                                  </span>
                                  <span>Next review: {formatDate(card.nextReview)}</span>
                                  <span>Interval: {card.interval} days</span>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteCard(card.id)}
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
                        No cards created yet. Add your first card above.
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
                    <span className="text-[var(--secondary-color)]">Total Cards</span>
                    <span className="font-semibold text-[var(--primary-color)]">{cards.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Due Today</span>
                    <span className="font-semibold text-[var(--primary-color)]">{dueCards.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--secondary-color)]">Completed Today</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {Math.max(0, dueCards.length - (dueCards.length - currentCardIndex))}
                    </span>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  How Spaced Repetition Works
                </h3>
                <div className="space-y-3 text-sm text-[var(--secondary-color)]">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Cards appear at increasing intervals</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Difficult cards appear more frequently</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Easy cards have longer intervals</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Optimizes long-term retention</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4">Benefits</h3>
                <ul className="space-y-2 text-sm text-[var(--secondary-color)]">
                  <li>• Maximizes retention with minimal time</li>
                  <li>• Prevents forgetting curve</li>
                  <li>• Adapts to your learning pace</li>
                  <li>• Scientifically proven method</li>
                  <li>• Builds long-term memory</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
