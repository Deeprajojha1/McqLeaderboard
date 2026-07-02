import React from 'react';
import clsx from 'clsx';
import { IndiaMap } from './IndiaMap';
import { Select } from '../ui/Select';
import { STATE_MAPPING, POPULAR_STATES } from './stateMapping';

export const StateSelector = ({ selectedState, onStateChange }) => {
  // Sort states alphabetically for the dropdown list
  const stateOptions = Object.keys(STATE_MAPPING)
    .sort()
    .map((name) => ({
      value: name,
      label: name,
    }));

  return (
    <div className={clsx('flex', 'flex-col', 'lg:flex-row', 'gap-8', 'items-center', 'w-full')}>
      {/* Map visualizer */}
      <div className={clsx('w-full', 'lg:w-3/5')}>
        <IndiaMap selectedState={selectedState} onStateClick={onStateChange} />
      </div>

      {/* Manual dropdown selector */}
      <div className={clsx('w-full', 'lg:w-2/5', 'flex', 'flex-col', 'justify-center')}>
        <div className={clsx('bg-slate-50', 'dark:bg-slate-900/40', 'border', 'border-slate-200', 'dark:border-slate-800', 'p-6', 'rounded-2xl', 'shadow-sm')}>
          <h4 className={clsx('text-base', 'font-semibold', 'text-slate-800', 'dark:text-slate-200', 'mb-3')}>
            Choose a Region
          </h4>
          <p className={clsx('text-xs', 'text-slate-500', 'dark:text-slate-400', 'mb-5', 'leading-relaxed')}>
            Click on any state on the map to select it, or choose a state manually from the dropdown menu below.
          </p>

          <Select
            label="Selected State/UT"
            placeholder="Choose a state..."
            options={stateOptions}
            value={selectedState || ''}
            onChange={(e) => onStateChange(e.target.value)}
          />

          {selectedState ? (
            <div className={clsx('mt-4', 'p-4', 'bg-brand-50', 'border', 'border-brand-100', 'rounded-xl', 'dark:bg-brand-950/20', 'dark:border-brand-900/40', 'flex', 'items-center', 'gap-3')}>
              <span className={clsx('flex', 'h-3', 'w-3', 'relative')}>
                <span className={clsx('animate-ping', 'absolute', 'inline-flex', 'h-full', 'w-full', 'rounded-full', 'bg-brand-400', 'opacity-75')}></span>
                <span className={clsx('relative', 'inline-flex', 'rounded-full', 'h-3', 'w-3', 'bg-brand-500')}></span>
              </span>
              <p className={clsx('text-sm', 'font-medium', 'text-brand-800', 'dark:text-brand-300')}>
                Active State: <span className={clsx('font-bold', 'text-brand-900', 'dark:text-brand-200')}>{selectedState}</span>
              </p>
            </div>
          ) : (
            <div className={clsx('mt-4', 'p-4', 'bg-amber-50', 'border', 'border-amber-100', 'rounded-xl', 'dark:bg-amber-950/20', 'dark:border-amber-900/40')}>
              <p className={clsx('text-xs', 'text-amber-700', 'dark:text-amber-400')}>
                Please select a state to view available categories and generate questions.
              </p>
            </div>
          )}

          {/* Popular States Quick Select */}
          <div className={clsx('mt-6', 'pt-6', 'border-t', 'border-slate-200', 'dark:border-slate-800/60')}>
            <h5 className={clsx('text-xs', 'font-bold', 'uppercase', 'tracking-wider', 'text-slate-400', 'dark:text-slate-500', 'mb-3')}>
              ⚡ Popular States
            </h5>
            <div className={clsx('grid', 'grid-cols-2', 'gap-2')}>
              {POPULAR_STATES.map((stateName) => {
                const isSelected = selectedState === stateName;
                return (
                  <button
                    key={stateName}
                    onClick={() => onStateChange(stateName)}
                    className={`text-left px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all truncate cursor-pointer ${
                      isSelected
                        ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/20 dark:border-brand-900 dark:text-brand-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    📍 {stateName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};