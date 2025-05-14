'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle,
  BookOpen,
  Zap,
  Layout,
  Shield,
  Users
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import SmoothScroll from '@/components/SmoothScroll';
import { CommandMenuTrigger } from '@/components/CommandMenuTrigger';

const GlideLandingPage = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        {/* Navigation */}
        <nav className="bg-[var(--nav-bg)] border-b border-[var(--nav-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-[var(--blue-accent)]">Glide</div>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                {/* <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Features</a> */}
                {/* <a href="#why-glide" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Why Glide</a> */}
                {/* <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Pricing</a> */}
                <CommandMenuTrigger />
                <ThemeToggle />
                <button
                  onClick={handleSignIn}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="Sign In"
                >
                  Sign In
                </button>
                <button
                  onClick={handleGetStarted}
                  className="bg-[var(--blue-accent)] hover:bg-[var(--blue-accent-hover)] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  aria-label="Sign Up Free"
                >
                  Sign Up Free
                </button>
              </div>
              <div className="md:hidden flex items-center space-x-4">
                <ThemeToggle />
                <button
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  aria-label="Open menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[var(--background)] to-[var(--background)] py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
                  A <span className="text-[var(--blue-accent)]">simpler</span> way to manage your college courses
                </h1>
                <p className="text-xl text-[var(--text-secondary)] mb-8">
                  Forget the clunky Canvas interface. Glide gives you a streamlined, beautiful course dashboard that puts everything you need front and center.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleGetStarted}
                    className="bg-[var(--blue-accent)] hover:bg-[var(--blue-accent-hover)] text-white px-6 py-3 rounded-lg font-medium text-lg transition-colors flex items-center justify-center"
                    aria-label="Get Started"

                  >
                    Get Started <ArrowRight className="ml-2 w-5 h-5" />
                  </button>

                </div>
              </div>
              <div className="bg-[var(--nav-bg)] p-4 rounded-xl shadow-lg border border-[var(--nav-border)]">
                <div className="bg-[var(--background)] rounded-lg p-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['CS101', 'MATH202', 'ENG104', 'PHYS101', 'BIO220', 'PSYCH101'].map((course, index) => {
                      const colors = [
                        'bg-[var(--course-blue)]',
                        'bg-[var(--course-purple)]',
                        'bg-[var(--course-green)]',
                        'bg-[var(--course-amber)]',
                        'bg-[var(--course-pink)]',
                        'bg-[var(--course-indigo)]'
                      ];

                      return (
                        <div
                          key={course}
                          className={`${colors[index]} rounded-lg p-4 flex flex-col items-center justify-center h-28 cursor-pointer transition-colors duration-200`}
                        >
                          <p className="text-xs font-semibold text-[var(--card-text-secondary)] mb-1">{course}</p>
                          <h4 className="font-bold text-[var(--card-text)] text-center">
                            {index === 0 ? 'Intro to CS' :
                             index === 1 ? 'Calculus II' :
                             index === 2 ? 'Writing' :
                             index === 3 ? 'Physics I' :
                             index === 4 ? 'Biology' : 'Psychology'}
                          </h4>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Glide Section */}
        <section id="why-glide" className="py-20 bg-[var(--nav-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Why Switch from Canvas to Glide?</h2>
              <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
                Canvas was designed for administrators. Glide was built for students, from the ground up.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-[var(--background)] rounded-xl p-8 border border-[var(--nav-border)] shadow-md">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Canvas Experience</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Complex, cluttered interface with too many options</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Slow loading times and multiple clicks to reach important information</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Inconsistent design across different sections and features</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Important deadlines and assignments can get buried</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Limited customization options for students</p>
                  </li>
                </ul>
              </div>

              <div className="bg-[var(--why-glide-bg)] rounded-xl p-8 shadow-md">
                <h3 className="text-2xl font-bold text-[var(--text-light)] mb-6">Glide Experience</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">Clean, intuitive interface focused on what students need</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">One-click access to your courses, assignments, and grades</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">Consistent, modern design throughout the entire platform</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">Priority display of upcoming deadlines and important announcements</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">Personalize your dashboard with custom colors and layouts</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section id="features" className="py-20 bg-[var(--background)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Features Students Love</h2>
              <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
                Designed with real student feedback to create the ideal learning management experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Lightning Fast</h3>
                <p className="text-[var(--text-secondary)]">
                  Optimized for speed with instant loading and snappy interactions. No more waiting for pages to load.
                </p>
              </div>

              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <Layout className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Customizable</h3>
                <p className="text-[var(--text-secondary)]">
                  Make Glide yours with custom colors, layouts, and prioritization of the features you use most.
                </p>
              </div>

              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <BookOpen className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Course-Centric</h3>
                <p className="text-[var(--text-secondary)]">
                  Your courses are front and center, with visual organization that makes it easy to focus on what matters.
                </p>
              </div>

              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Secure</h3>
                <p className="text-[var(--text-secondary)]">
                  End-to-end encryption and modern security practices keep your academic information safe.
                </p>
              </div>

              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Collaborative</h3>
                <p className="text-[var(--text-secondary)]">
                  Built-in tools for group projects, discussion, and peer feedback make teamwork seamless.
                </p>
              </div>

              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <svg className="h-6 w-6 text-[var(--background)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Mobile-First</h3>
                <p className="text-[var(--text-secondary)]">
                  A fully responsive design means Glide works beautifully on all your devices, from phone to desktop.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[var(--blue-accent)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-[var(--text-light)] mb-6">Ready to transform your academic experience?</h2>
            <p className="text-xl text-[var(--text-light)] mb-8 max-w-3xl mx-auto">
              Join thousands of students who&apos;ve made the switch to Glide. Your courses, your way.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleGetStarted}
                className="bg-[var(--background)] text-[var(--text-primary)] hover:bg-[var(--nav-bg)] px-8 py-3 rounded-lg font-medium text-lg transition-colors"
                aria-label="Sign Up Free"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[var(--background)] border-t border-[var(--nav-border)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-bold text-[var(--blue-accent)] mb-4">Glide</div>
                <p className="text-[var(--text-secondary)] mb-4">A better way to manage your college courses.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Features</a></li>
                  <li><a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Pricing</a></li>
                  <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">API</a></li>
                  <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Integrations</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">About</a></li>
                  <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Blog</a></li>
                  <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Careers</a></li>
                  <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Contact</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Privacy</a></li>
                  <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Terms</a></li>
                  <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cookie Policy</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-[var(--nav-border)]">
              <p className="text-[var(--text-secondary)] text-sm text-center">
                &copy; {new Date().getFullYear()} Glide, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
};

export default GlideLandingPage;
