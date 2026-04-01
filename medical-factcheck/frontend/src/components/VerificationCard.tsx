'use client';

import React, { useState } from 'react';
import { VerificationResult } from '@/services/api';

interface VerificationCardProps {
  result: VerificationResult;
  claimId?: number;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({ result, claimId }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'true':
        return 'bg-green-100 text-green-800';
      case 'false':
        return 'bg-red-100 text-red-800';
      case 'partially_true':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLabelText = (label: string) => {
    switch (label) {
      case 'true':
        return '✓ Verified True';
      case 'false':
        return '✗ Verified False';
      case 'partially_true':
        return '⚠ Partially True';
      default:
        return '? Unverifiable';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {result.claim}
          </h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getLabelColor(result.verification_label)}`}>
            {getLabelText(result.verification_label)}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Confidence</p>
          <p className="text-2xl font-bold text-blue-600">
            {(result.confidence_score * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 rounded p-4 mb-4">
        <p className="text-sm text-gray-700">{result.explanation}</p>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Claim Type</p>
          <p className="font-medium text-gray-900">{result.claim_type}</p>
        </div>
        <div>
          <p className="text-gray-500">Medical Domain</p>
          <p className="font-medium text-gray-900">{result.medical_domain}</p>
        </div>
      </div>

      {/* Darija Translations */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {showDetails ? '▼' : '▶'} Moroccan Darija Translation
      </button>

      {showDetails && (
        <div className="mt-4 bg-gray-50 rounded p-4">
          <div className="mb-3">
            <p className="text-xs text-gray-500">LATIN SCRIPT</p>
            <p className="text-gray-900">{result.darija_latin}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ARABIC SCRIPT</p>
            <p className="text-gray-900 text-right">{result.darija_arabic}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500 border-t pt-4">
        <p>Claim ID: {claimId || '-'}</p>
        <p>{result.processing_time_ms ? `${result.processing_time_ms.toFixed(2)}ms` : '-'}</p>
      </div>
    </div>
  );
};
