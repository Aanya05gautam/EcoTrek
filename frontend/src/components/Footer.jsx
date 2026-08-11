import React from 'react';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-emerald-100 py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
        <Leaf className="text-emerald-300 mb-4 h-8 w-8" />
        <div className="text-center text-emerald-700/60 font-medium text-sm">
          <b className="text-emerald-800 mr-2">EcoTrek</b> &middot; AI-powered smart municipal waste management prototype &middot; SDG 11 & SDG 12
        </div>
      </div>
    </footer>
  );
}
