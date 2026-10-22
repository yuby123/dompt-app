'use client';

import React from 'react';
import { AnalyticsTab } from './AnalyticsTab';

/**
 * HealthScoreTab is now unified into AnalyticsTab as requested by the user.
 * This component re-exports AnalyticsTab for complete backward compatibility.
 */
export function HealthScoreTab() {
  return <AnalyticsTab />;
}
