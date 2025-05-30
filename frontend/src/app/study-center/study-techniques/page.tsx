'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/Header';
import {
  Clock,
  Brain,
  Repeat,
  BookOpen,
  Lightbulb,
  Timer,
  Map,
  Layers,
  Focus,
  RefreshCw,
  Zap,
  ArrowLeft
} from 'lucide-react';

interface TechniqueCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeRequired: string;
  iconBgColor: string;
  iconColor: string;
  onClick: () => void;
}

const TechniqueCard = ({
  title,
  description,
  icon,
  difficulty,
  timeRequired,
  iconBgColor,
  iconColor,
  onClick
}: TechniqueCardProps) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-[var(--glide-blue)] cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        <div
          className="p-3 rounded-lg flex-shrink-0"
          style={{
            backgroundColor: iconBgColor,
            color: iconColor
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[var(--primary-color)]">
              {title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
          </div>
          <p className="text-[var(--secondary-color)] text-sm leading-relaxed mb-3">
            {description}
          </p>
          <div className="flex items-center text-xs text-[var(--secondary-color)]">
            <Clock className="w-3 h-3 mr-1" />
            <span>{timeRequired}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CategorySectionProps {
  title: string;
  description: string;
  techniques: TechniqueCardProps[];
}

const CategorySection = ({ title, description, techniques }: CategorySectionProps) => {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--primary-color)] mb-2">{title}</h2>
        <p className="text-[var(--secondary-color)]">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {techniques.map((technique, index) => (
          <TechniqueCard
            key={index}
            {...technique}
          />
        ))}
      </div>
    </div>
  );
};

export default function StudyTechniquesPage() {
  const router = useRouter();

  const timeManagementTechniques = [
    {
      title: 'Pomodoro Technique',
      description: 'Work in focused 25-minute intervals with short breaks to maintain concentration and prevent burnout.',
      icon: <Timer className="w-6 h-6" />,
      difficulty: 'Beginner' as const,
      timeRequired: '25-30 min sessions',
      iconBgColor: '#ffebee',
      iconColor: '#d32f2f',
      onClick: () => router.push('/study-center/study-techniques/pomodoro')
    },
    {
      title: 'Time Blocking',
      description: 'Schedule specific time blocks for different subjects and activities to maximize productivity.',
      icon: <Clock className="w-6 h-6" />,
      difficulty: 'Intermediate' as const,
      timeRequired: '15 min setup',
      iconBgColor: '#e3f2fd',
      iconColor: '#1976d2',
      onClick: () => router.push('/study-center/study-techniques/time-blocking')
    },
    {
      title: 'Deep Study',
      description: 'Intensive study sessions with AI-guided learning paths and progress tracking.',
      icon: <Focus className="w-6 h-6" />,
      difficulty: 'Advanced' as const,
      timeRequired: '1-3 hours',
      iconBgColor: '#f3e5f5',
      iconColor: '#7b1fa2',
      onClick: () => router.push('/study-center/study-techniques/deep-study')
    }
  ];

  const activeLearningTechniques = [
    {
      title: 'Active Recall',
      description: 'Test yourself frequently without looking at notes to strengthen memory and understanding.',
      icon: <Brain className="w-6 h-6" />,
      difficulty: 'Beginner' as const,
      timeRequired: '20-45 min',
      iconBgColor: '#e8f5e8',
      iconColor: '#388e3c',
      onClick: () => router.push('/study-center/study-techniques/active-recall')
    },
    {
      title: 'Spaced Repetition',
      description: 'Review material at increasing intervals to optimize long-term retention.',
      icon: <Repeat className="w-6 h-6" />,
      difficulty: 'Intermediate' as const,
      timeRequired: '15-30 min daily',
      iconBgColor: '#fff3e0',
      iconColor: '#f57c00',
      onClick: () => router.push('/study-center/study-techniques/spaced-repetition')
    },
    {
      title: 'Feynman Technique',
      description: 'Explain concepts in simple terms as if teaching someone else to identify knowledge gaps.',
      icon: <Lightbulb className="w-6 h-6" />,
      difficulty: 'Intermediate' as const,
      timeRequired: '30-60 min',
      iconBgColor: '#fff8e1',
      iconColor: '#fbc02d',
      onClick: () => router.push('/study-center/study-techniques/feynman')
    }
  ];

  const memoryTechniques = [
    {
      title: 'Mind Mapping',
      description: 'Create visual diagrams to connect ideas and improve understanding of complex topics.',
      icon: <Map className="w-6 h-6" />,
      difficulty: 'Beginner' as const,
      timeRequired: '20-40 min',
      iconBgColor: '#e0f2fe',
      iconColor: '#0277bd',
      onClick: () => router.push('/study-center/study-techniques/mind-mapping')
    },
    {
      title: 'Memory Palace',
      description: 'Use spatial memory to remember information by associating it with familiar locations.',
      icon: <BookOpen className="w-6 h-6" />,
      difficulty: 'Advanced' as const,
      timeRequired: '45-90 min',
      iconBgColor: '#fce4ec',
      iconColor: '#c2185b',
      onClick: () => router.push('/study-center/study-techniques/memory-palace')
    },
    {
      title: 'Chunking',
      description: 'Break down complex information into smaller, manageable pieces for easier memorization.',
      icon: <Layers className="w-6 h-6" />,
      difficulty: 'Beginner' as const,
      timeRequired: '15-30 min',
      iconBgColor: '#f1f8e9',
      iconColor: '#689f38',
      onClick: () => router.push('/study-center/study-techniques/chunking')
    }
  ];

  const reviewTechniques = [
    {
      title: 'Refresh Study',
      description: 'Quick review sessions to reinforce previously learned material and maintain knowledge.',
      icon: <RefreshCw className="w-6 h-6" />,
      difficulty: 'Beginner' as const,
      timeRequired: '10-20 min',
      iconBgColor: '#e0f7fa',
      iconColor: '#00acc1',
      onClick: () => router.push('/study-center/study-techniques/refresh-study')
    },
    {
      title: 'Interleaving',
      description: 'Mix different topics or problem types in a single study session to improve learning.',
      icon: <Zap className="w-6 h-6" />,
      difficulty: 'Intermediate' as const,
      timeRequired: '45-90 min',
      iconBgColor: '#e8eaf6',
      iconColor: '#5e35b1',
      onClick: () => router.push('/study-center/study-techniques/interleaving')
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      <Header title="Study Techniques" />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back to Study Center Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/study-center')}
              className="flex items-center px-4 py-2 text-[var(--glide-blue)] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Study Center
            </button>
          </div>

          <div className="space-y-8">
            <CategorySection
              title="Time Management"
              description="Techniques to organize your study time and maintain focus"
              techniques={timeManagementTechniques}
            />

            <CategorySection
              title="Active Learning"
              description="Methods to engage actively with material for deeper understanding"
              techniques={activeLearningTechniques}
            />

            <CategorySection
              title="Memory & Retention"
              description="Strategies to improve memorization and long-term retention"
              techniques={memoryTechniques}
            />

            <CategorySection
              title="Review & Reinforcement"
              description="Techniques to review and strengthen previously learned material"
              techniques={reviewTechniques}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
