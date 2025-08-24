'use client'

import { Button } from '@/components/ui/button';
import { LayoutDashboard, Settings } from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModeToggle } from './mode-toggle';

interface SharedHeaderProps {
  showSettings?: boolean;
}

export default function SharedHeader({ showSettings = true }: SharedHeaderProps): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Show dashboard button only on root route
  const showDashboardButton = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-16">
      <div className="flex items-center justify-between px-6 py-4 h-full">
        {/* Left: Icon and ONE branding - clickable to navigate home */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src="/icon.png"
              alt="ONE Application Icon"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-primary">ONE</span>
        </button>
        
        {/* Right: Mode Toggle, Dashboard Button and Settings */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          {showDashboardButton && (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          )}
          {showSettings && (
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}