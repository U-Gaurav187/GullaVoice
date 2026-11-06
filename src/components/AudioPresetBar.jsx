import React from 'react';
import { Sparkles, Volume2, ArrowRight, Zap } from 'lucide-react';
import { NOISY_GALLA_PRESETS } from '../data/noisyGallaPresets';

export default function AudioPresetBar({ onSelectPreset, isProcessing }) {
  return (
    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500 text-white">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>शोरगुल ऑडियो सिमुलेटर</span>
              <span className="text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300">
                Simulate Noisy Galla Audio (1-Click Test Bar)
              </span>
            </h3>
            <p className="text-xs text-stone-600">
              Judges: Click any test card below to test messy Hinglish speech, mid-sentence side-talk, and regional accents.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {NOISY_GALLA_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            disabled={isProcessing}
            className="group text-left p-3 rounded-xl bg-white hover:bg-amber-100/50 border border-stone-200 hover:border-amber-400 transition-all duration-150 shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-stone-800 group-hover:text-amber-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {preset.title}
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 group-hover:bg-amber-200 group-hover:text-amber-900 border border-stone-200">
                  {preset.tag}
                </span>
              </div>
              <p className="text-xs font-mono text-stone-600 line-clamp-2 italic bg-stone-50 p-1.5 rounded border border-stone-100 mb-2">
                "{preset.spokenText}"
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100 text-stone-500">
              <span className="font-medium text-stone-700">
                Expected: {preset.expectedCustomer} • {preset.expectedTotal > 0 ? `₹${preset.expectedTotal}` : 'No Khata'}
              </span>
              <span className="text-amber-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                Run <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
