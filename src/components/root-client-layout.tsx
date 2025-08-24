'use client'

import type { JSX, ReactNode } from 'react'
import { ThemeProvider } from "./theme-provider"

interface RootClientLayoutProps {
  children: ReactNode;
}

export default function RootClientLayout({
  children,
}: RootClientLayoutProps): JSX.Element {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {children}
    </ThemeProvider>
  )
}