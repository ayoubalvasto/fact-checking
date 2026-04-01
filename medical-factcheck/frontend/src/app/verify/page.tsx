'use client';

import React, { useState } from 'react';
import { apiClient, VerifyResponse } from '@/services/api';
import { VerificationCard } from '@/components/VerificationCard';

export default function VerifyPage() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('ar');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.verify(text, language);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Medical Claim Verifier</h1>
          <p className="text-gray-600">Enter a medical claim to verify its accuracy</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleVerify} className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
              Medical Claim
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter a medical claim in Arabic or English..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{text.length} characters</p>
          </div>

          <div className="mb-6">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ar">Arabic (العربية)</option>
              <option value="en">English</option>
              <option value="fr">French (Français)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Verifying...
              </span>
            ) : (
              'Verify Claim'
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Result</h2>
            <VerificationCard result={result.data} claimId={result.claim_id} />
          </div>
        )}
      </div>
    </div>
  );
}
