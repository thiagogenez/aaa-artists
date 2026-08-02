"use client";

import { useSyncExternalStore } from "react";
import {
  getMediaConsent,
  getServerMediaConsent,
  subscribeMediaConsent,
  type MediaConsent,
} from "@/lib/media-consent";

/** Current media-embed consent, kept in step across components and tabs. */
export function useMediaConsent(): MediaConsent {
  return useSyncExternalStore(subscribeMediaConsent, getMediaConsent, getServerMediaConsent);
}
