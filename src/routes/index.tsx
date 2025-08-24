'use client'

import type { JSX } from 'react'
import OneLandingPas3Preview from '../components/landing-content'
import RootClientLayout from '../components/root-client-layout'
import RouteErrorBoundary from '../components/route-error-boundary'
import SharedHeader from '../components/shared-header'

export default function IndexPage(): JSX.Element {
  return (
    <RouteErrorBoundary routeName="Landing Page">
      <RootClientLayout>
        <div className="min-h-screen bg-background">
          <SharedHeader showSettings={false} />
          <div className="pt-16">
            <OneLandingPas3Preview />
          </div>
        </div>
      </RootClientLayout>
    </RouteErrorBoundary>
  )
}
