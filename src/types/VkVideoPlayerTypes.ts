import type { ComponentProps } from 'react';
import type WebView from 'react-native-webview';
import type { VkPlayerEvent, VkVideoQuality, VkVideoEventData } from './vkPlayerTypes';

export interface VkVideoPlayerProps {
  src: string;
  hideControls?: boolean;
  webviewProps?: ComponentProps<typeof WebView>;
  paused?: boolean;
  debug?: boolean;
  onEvent?: (event: VkPlayerEvent) => void;
}

export interface VkVideoPlayerHandle {
  getAvailableQualities: () => Promise<VkVideoQuality[]>;
  on: <E extends keyof VkVideoEventData>(eventName: E, listener: (event: VkPlayerEvent<E>) => void) => () => void;
  setQuality: (quality: VkVideoQuality) => Promise<void>;
  seek: (time: number) => Promise<void>;
  seekLive: () => Promise<void>;
}
