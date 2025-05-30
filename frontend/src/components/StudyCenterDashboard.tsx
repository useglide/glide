'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Video,
  Calculator,
  FileText,
  Brain,
  FolderOpen,
  BookOpen,
  Microscope,
  GraduationCap,
  RefreshCw
} from 'lucide-react';

interface WidgetCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  iconBgColor?: string;
  iconColor?: string;
}

const WidgetCard = ({ title, description, icon, onClick, iconBgColor, iconColor }: WidgetCardProps) => {
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-[var(--glide-blue)] cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: iconBgColor || '#e0f2fe',
            color: iconColor || '#0277bd'
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-2">
            {title}
          </h3>
          <p className="text-[var(--secondary-color)] text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

interface CategorySectionProps {
  title: string;
  description: string;
  widgets: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick?: () => void;
    iconBgColor?: string;
    iconColor?: string;
  }>;
}

const CategorySection = ({ title, description, widgets }: CategorySectionProps) => {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--primary-color)] mb-2">{title}</h2>
        <p className="text-[var(--secondary-color)]">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget, index) => (
          <WidgetCard
            key={index}
            title={widget.title}
            description={widget.description}
            icon={widget.icon}
            onClick={widget.onClick}
            iconBgColor={widget.iconBgColor}
            iconColor={widget.iconColor}
          />
        ))}
      </div>
    </div>
  );
};

export function StudyCenterDashboard() {
  const router = useRouter();

  const researchDiscoveryWidgets = [
    {
      title: 'Resource Finder',
      description: 'Discover relevant academic resources, papers, and materials for your courses and research topics.',
      icon: <Search className="w-6 h-6" />,
      iconBgColor: '#e8f5e8',
      iconColor: '#2e7d32',
      onClick: () => router.push('/study-center/resource-finder')
    },
    {
      title: 'Video Recommender',
      description: 'Get personalized video recommendations from educational platforms based on your learning needs.',
      icon: <Video className="w-6 h-6" />,
      iconBgColor: '#fff3e0',
      iconColor: '#f57c00',
      onClick: () => router.push('/study-center/video-recommender')
    },
    {
      title: 'Deep Research',
      description: 'Conduct comprehensive research with AI-powered analysis and source compilation.',
      icon: <Microscope className="w-6 h-6" />,
      iconBgColor: '#f3e5f5',
      iconColor: '#7b1fa2',
      onClick: () => router.push('/study-center/deep-research')
    }
  ];

  const studyToolsWidgets = [
    {
      title: 'Graphing Calculator',
      description: 'Advanced mathematical calculations and graphing capabilities for STEM courses.',
      icon: <Calculator className="w-6 h-6" />,
      iconBgColor: '#e3f2fd',
      iconColor: '#1565c0',
      onClick: () => router.push('/study-center/graphing-calculator')
    },
    {
      title: 'Lecture Summarizer',
      description: 'Automatically generate concise summaries from lecture recordings and transcripts.',
      icon: <FileText className="w-6 h-6" />,
      iconBgColor: '#fff8e1',
      iconColor: '#ff8f00',
      onClick: () => router.push('/study-center/lecture-summarizer')
    },
    {
      title: 'Flashcard Maker',
      description: 'Create interactive flashcards from your notes and study materials with spaced repetition.',
      icon: <Brain className="w-6 h-6" />,
      iconBgColor: '#fce4ec',
      iconColor: '#c2185b',
      onClick: () => router.push('/study-center/flashcard-maker')
    },
    {
      title: 'Study Guide Maker',
      description: 'Generate comprehensive study guides tailored to your courses and upcoming exams.',
      icon: <BookOpen className="w-6 h-6" />,
      iconBgColor: '#e8f5e8',
      iconColor: '#388e3c',
      onClick: () => router.push('/study-center/study-guide-maker')
    }
  ];

  const contentManagementWidgets = [
    {
      title: 'Past Notes Viewer',
      description: 'Access and organize all your previous notes with intelligent search and categorization.',
      icon: <FolderOpen className="w-6 h-6" />,
      iconBgColor: '#f1f8e9',
      iconColor: '#689f38',
      onClick: () => router.push('/study-center/past-notes-viewer')
    },
    {
      title: 'Deep Study',
      description: 'Intensive study sessions with AI-guided learning paths and progress tracking.',
      icon: <GraduationCap className="w-6 h-6" />,
      iconBgColor: '#e8eaf6',
      iconColor: '#5e35b1',
      onClick: () => router.push('/study-center/deep-study')
    },
    {
      title: 'Refresh Study',
      description: 'Quick review sessions to reinforce previously learned material and maintain knowledge.',
      icon: <RefreshCw className="w-6 h-6" />,
      iconBgColor: '#e0f7fa',
      iconColor: '#00acc1',
      onClick: () => router.push('/study-center/refresh-study')
    }
  ];

  return (
    <div className="space-y-8">
      <CategorySection
        title="Research & Discovery"
        description="Find and explore academic resources with intelligent recommendations"
        widgets={researchDiscoveryWidgets}
      />

      <CategorySection
        title="Study Tools"
        description="Interactive tools to enhance your learning and comprehension"
        widgets={studyToolsWidgets}
      />

      <CategorySection
        title="Content Management"
        description="Organize and review your academic materials efficiently"
        widgets={contentManagementWidgets}
      />
    </div>
  );
}
