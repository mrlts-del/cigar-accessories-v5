'use client';

import React, { useState, useEffect } from 'react';
import { signIn, getProviders, ClientSafeProvider } from 'next-auth/react';

const SignInPage = () => {
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Sign In / Register</h1>
      {/* Login/Register form and Google Sign-In button will be added here in the next step */}
      {providers &&
        Object.values(providers).map((provider) => (
          <div key={provider.name} className="mb-4">
            {/* Only render Google for now as per instructions */}
            {provider.id === 'google' && (
              <button
                onClick={() => signIn(provider.id)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" // Basic styling
              >
                Sign in with {provider.name}
              </button>
            )}
          </div>
        ))}
    </div>
  );
};

export default SignInPage;