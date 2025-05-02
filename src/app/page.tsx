'use client';

import React from 'react';

export default function Home() {
  return (
    <main className="container mx-auto flex h-screen items-center justify-center px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Application Unavailable
        </h1>
        <p className="text-lg text-muted-foreground">
          This application is currently unpublished or under maintenance.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
            Please check back later.
        </p>
      </div>
    </main>
  );
}
