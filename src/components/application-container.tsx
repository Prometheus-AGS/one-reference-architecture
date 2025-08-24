'use client'

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/components/ui/sidebar';
import { useAppNavigation, useCurrentNavigation } from '@/hooks/use-navigation';
import { Activity, Database, HardDrive, Home, Network, Server } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationItem } from '../stores/navigation';
import SharedHeader from './shared-header';

interface ApplicationContainerProps {
  children: React.ReactNode;
}

// Icon mapping for navigation items
const iconMap = {
  Database,
  Server,
  HardDrive,
  Network,
  Activity,
  Home
};

export default function ApplicationContainer({ children }: ApplicationContainerProps) {
  const { items, isLoading, error, navigateTo, clearError } = useAppNavigation();
  const { currentItem, isReady } = useCurrentNavigation();
  const navigate = useNavigate();

  // DEBUG: Log current layout structure
  console.log('🔍 ApplicationContainer Debug:', {
    currentItem: currentItem?.title,
    itemsCount: items.length,
    hasActiveItem: items.some(item => item.isActive),
    layoutStructure: 'SidebarProvider > Sidebar + MainContent'
  });

  // Show loading state during initialization
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              Initializing Architecture
            </CardTitle>
            <CardDescription>
              Setting up Tuono + Tauri integration components...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="text-red-800">Initialization Error</CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={clearError} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader showSettings={true} />

      <SidebarProvider>
        <div className="flex w-full pt-20">
          {/* Sidebar Navigation - positioned under header */}
          <Sidebar className="border-r border-border bg-background/80 backdrop-blur-sm">
            <SidebarContent className="p-4 pt-20 pb-8">
              <SidebarMenu>
                {items.map((item: NavigationItem) => {
                  const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Database;
                  
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => {
                          console.log('🔍 Sidebar Navigation:', { item: item.title, path: item.path });
                          navigateTo(item);
                          navigate(item.path);
                        }}
                        isActive={item.isActive}
                        size="lg"
                        className="w-full justify-start gap-3 h-16 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:border-primary/20"
                      >
                        <IconComponent className="w-5 h-5" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Content Area */}
            <main className="flex-1 p-6 overflow-auto mt-4 bg-background">
              {children}
            </main>

            {/* Footer */}
            <footer className="bg-background/80 backdrop-blur-sm border-t border-border p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>React Router + Tuono API</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Unified routing with Rust API backend</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    v{process.env.NODE_ENV === 'development' ? 'dev' : '1.0.0'}
                  </Badge>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}