'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  CheckCircle,
  Calendar,
  Settings,
  GraduationCap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

interface CollapsibleSidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasActiveChild?: boolean;
}

const SidebarItem = ({ href, icon, label, isActive }: SidebarItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors",
        isActive
          ? "bg-[var(--light-grey)] text-[var(--primary-color)] font-medium"
          : "text-[var(--secondary-color)] hover:bg-[var(--light-grey)] hover:text-[var(--primary-color)]"
      )}
    >
      <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

const CollapsibleSidebarItem = ({
  label,
  isExpanded,
  onToggle,
  children,
  hasActiveChild
}: Omit<CollapsibleSidebarItemProps, 'icon'>) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors",
          hasActiveChild
            ? "bg-[var(--light-grey)] text-[var(--primary-color)] font-medium"
            : "text-[var(--secondary-color)] hover:bg-[var(--light-grey)] hover:text-[var(--primary-color)]"
        )}
      >
        <span className="w-6 h-6 flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </span>
        <span className="flex-1 text-left">{label}</span>
      </button>
      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  // Define main sidebar items in the new order
  const mainSidebarItems = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Dashboard',
    },
    {
      href: '/todo',
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'To-Do',
    },
    {
      href: '/calendar',
      icon: <Calendar className="w-5 h-5" />,
      label: 'Calendar',
    },
    {
      href: '/study-center',
      icon: <GraduationCap className="w-5 h-5" />,
      label: 'Study Center',
    },
  ];

  // Define items that go under "More"
  const moreItems = [
    {
      href: '/courses',
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Courses',
    },
    {
      href: '/assignments',
      icon: <Briefcase className="w-5 h-5" />,
      label: 'Assignments',
    },
  ];

  // Settings item is separated at the bottom
  const settingsItem = {
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
  };

  // Check if any "More" items are active
  const hasActiveMoreItem = moreItems.some(item =>
    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  );

  const toggleMore = () => {
    setIsMoreExpanded(!isMoreExpanded);
  };



  return (
    <aside className="bg-[var(--white-grey)] h-screen fixed left-0 top-0 flex flex-col w-60 z-40 shadow-sm">
      <div className="h-16 flex items-center px-6">
        <div className="text-[2rem] font-bold text-[var(--glide-blue)]">Glide</div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {/* Main sidebar items */}
          {mainSidebarItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
            />
          ))}

          {/* More collapsible section */}
          <CollapsibleSidebarItem
            label="More"
            isExpanded={isMoreExpanded}
            onToggle={toggleMore}
            hasActiveChild={hasActiveMoreItem}
          >
            {moreItems.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              />
            ))}
          </CollapsibleSidebarItem>
        </div>
      </nav>

      <div className="px-3 py-6 mt-auto">
        <SidebarItem
          href={settingsItem.href}
          icon={settingsItem.icon}
          label={settingsItem.label}
          isActive={pathname === settingsItem.href}
        />
      </div>
    </aside>
  );
}
