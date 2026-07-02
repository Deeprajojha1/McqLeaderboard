import React from 'react';
import { IndiaMap as BaseIndiaMap } from '@vishalvoid/react-india-map';
import { STATE_MAPPING, STATE_ID_TO_NAME, POPULAR_STATES } from './stateMapping';

export const IndiaMap = ({
  onStateClick,
  selectedState,
  hoverColor = '#3b82f6', // Tailwind blue-500
  selectedColor = '#f97316', // Tailwind orange-500
  defaultColor = '#cbd5e1', // Tailwind slate-300
  popularColor = '#a855f7', // Tailwind purple-500
  strokeColor = '#ffffff',
  strokeWidth = 1.5,
}) => {
  const selectedId = selectedState ? STATE_MAPPING[selectedState] : null;

  // Build the list of popular state IDs
  const popularIds = POPULAR_STATES.map(name => STATE_MAPPING[name]).filter(Boolean);

  const handleStateClick = (stateId) => {
    const fullStateName = STATE_ID_TO_NAME[stateId];
    if (fullStateName && onStateClick) {
      onStateClick(fullStateName);
    }
  };

  // We inject custom CSS into a style tag to style paths dynamically
  const dynamicStyles = `
    .india-map-container path {
      fill: ${defaultColor} !important;
      stroke: ${strokeColor} !important;
      stroke-width: ${strokeWidth}px !important;
      transition: fill 0.25s ease, opacity 0.2s ease !important;
    }
    
    /* Highlight popular states with a distinctive purple tone */
    ${popularIds.map(id => `
      .india-map-container path#${id} {
        fill: ${popularColor} !important;
        opacity: 0.85;
      }
    `).join('\n')}

    /* Hover effect */
    .india-map-container path:hover {
      fill: ${hoverColor} !important;
      opacity: 1 !important;
      cursor: pointer;
    }

    /* Selected state takes highest priority */
    ${selectedId ? `
      .india-map-container path#${selectedId} {
        fill: ${selectedColor} !important;
        opacity: 1 !important;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15)) !important;
      }
    ` : ''}

    /* Custom style for the library's tooltip */
    .state-tooltip {
      font-family: inherit !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      padding: 6px 12px !important;
    }
  `;

  return (
    <div className="relative w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      <div className="india-map-container w-full max-w-[550px] aspect-[611/695]">
        <BaseIndiaMap
          mapStyle={{
            backgroundColor: 'transparent',
            hoverColor: hoverColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            tooltipConfig: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              textColor: '#ffffff',
            }
          }}
          onStateClick={handleStateClick}
        />
      </div>
    </div>
  );
};
