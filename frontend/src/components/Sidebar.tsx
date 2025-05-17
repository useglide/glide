'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  CheckCircle,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
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

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Define sidebar items
  const sidebarItems = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Dashboard',
    },
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
    {
      href: '/todo',
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'To-Do',
    },
  ];

  // Settings item is separated at the bottom
  const settingsItem = {
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
  };

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <aside className="bg-[var(--white-grey)] h-screen fixed left-0 top-0 flex flex-col w-60 z-40 shadow-sm">
      <div className="p-6">
        <div className="text-[2rem] font-bold text-[var(--glide-blue)]">Glide</div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
            />
          ))}
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
