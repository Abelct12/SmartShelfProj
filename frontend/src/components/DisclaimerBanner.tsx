import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-900">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p>
            <strong className="font-semibold">Academic & Research Notice:</strong> Shelf life predictions are statistical machine learning estimates derived from kinetic degradation models. Predictions do not guarantee food safety, microbiological sterility, or replace certified laboratory testing and official food safety standards.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-700 hover:text-amber-900 p-1 rounded hover:bg-amber-100 flex-shrink-0 transition-colors"
          title="Dismiss advisory"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
