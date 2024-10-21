import { useCallback, useEffect, useMemo } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';
import { type VkPlayerInjectFn, VkVideoEventName } from '../types/vkPlayerTypes';
import type { VkVideoPlayerHandle, VkVideoPlayerProps } from '../types/VkVideoPlayerTypes';
import { modifyVkUrl } from '../utils/format';
import {
  createInjectInitScript,
  createInjectIsPausedScript,
  createInjectPauseScript,
  createInjectPlayScript,
} from '../utils/injectScript';

export function useVkPlayerWebView(
  props: VkVideoPlayerProps,
  injectScript: VkPlayerInjectFn,
  subscribeEvent: VkVideoPlayerHandle['on'],
  onVkPlayerEvent: (event?: unknown) => void
) {
  const { paused, src, hideControls, debug } = props;

  const modifiedSrc = useMemo(() => modifyVkUrl(src), [src]);
  const injectInitScript = useMemo(
    () => createInjectInitScript(modifiedSrc, hideControls),
    [modifiedSrc, hideControls]
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        if (!event.nativeEvent.data?.includes('timeupdate') && debug) {
          console.log(`[VkVideoPlayer.onMessage]`, event.nativeEvent.data);
        }
        const json = JSON.parse(event.nativeEvent.data);
        onVkPlayerEvent(json);
      } catch (e) {
        console.error(`[VkVideoPlayer.onMessage]`, e);
      }
    },
    [debug, onVkPlayerEvent]
  );

  // Sync paused state
  const updatePlayerPaused = useCallback(async () => {
    const response = await injectScript<VkVideoEventName.ISPAUSED>(createInjectIsPausedScript);
    if (response.data !== paused) {
      if (paused) {
        injectScript(createInjectPauseScript);
      } else {
        injectScript(createInjectPlayScript);
      }
    }
  }, [injectScript, paused]);
  useEffect(() => {
    const disposers = [
      subscribeEvent(VkVideoEventName.STARTED, updatePlayerPaused),
      subscribeEvent(VkVideoEventName.RESUMED, updatePlayerPaused),
      subscribeEvent(VkVideoEventName.PAUSED, updatePlayerPaused),
      subscribeEvent(VkVideoEventName.ENDED, updatePlayerPaused),
    ];

    updatePlayerPaused();

    return () => disposers.forEach((d) => d());
  }, [paused, updatePlayerPaused, subscribeEvent]);

  return {
    modifiedSrc,
    injectInitScript,
    onMessage,
  };
}
