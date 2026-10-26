'use client';

import { useEffect } from 'react';
import { startSync } from '@/lib/sync';

/** Starts cloud sync once on the client. Renders nothing. */
export function SyncBoot() {
  useEffect(() => startSync(), []);
  return null;
}
