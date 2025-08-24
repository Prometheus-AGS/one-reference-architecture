'use client'

import mermaid from 'mermaid'
import { useEffect, useRef } from 'react'

interface MermaidProps {
  chart: string
  id: string
  className?: string
}

// Initialize mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: 'hsl(var(--primary))',
    primaryTextColor: 'hsl(var(--primary-foreground))',
    primaryBorderColor: 'hsl(var(--border))',
    lineColor: 'hsl(var(--border))',
    secondaryColor: 'hsl(var(--secondary))',
    tertiaryColor: 'hsl(var(--muted))',
    background: 'hsl(var(--background))',
    mainBkg: 'hsl(var(--card))',
    secondBkg: 'hsl(var(--muted))',
    tertiaryTextColor: 'hsl(var(--muted-foreground))'
  }
})

export function Mermaid({ chart, id, className = '' }: MermaidProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderMermaid = async () => {
      if (mermaidRef.current && chart) {
        try {
          const uniqueId = `mermaid-${id}-${Date.now()}`
          const { svg } = await mermaid.render(uniqueId, chart)
          mermaidRef.current.innerHTML = svg
        } catch (error) {
          console.error('Mermaid rendering error:', error)
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = '<div class="text-destructive">Diagram rendering error</div>'
          }
        }
      }
    }

    renderMermaid()
  }, [chart, id])

  return (
    <div 
      ref={mermaidRef} 
      className={`mermaid-container ${className}`}
      id={`mermaid-wrapper-${id}`}
    />
  )
}

export default Mermaid