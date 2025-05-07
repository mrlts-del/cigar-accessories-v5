'use client';

import React, { Suspense } from 'react';

const NotFoundPageClient = () => {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      {/* Add 404 page content here */}
    </div>
  );
};

const NotFound = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundPageClient />
    </Suspense>
  );
};

export default NotFound;