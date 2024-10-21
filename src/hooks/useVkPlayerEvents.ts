import { useCallback, useRef, type RefObject } from 'react';
import type WebView from 'react-native-webview';
import {
  type VkPlayerEvent,
  type VkVideoEventName,
  type VkPlayerInjectFn,
  checkVkPlayerEvent,
} from '../types/vkPlayerTypes';
import type { VkVideoPlayerHandle, VkVideoPlayerProps } from '../types/VkVideoPlayerTypes';

export function useVkPlayerEvents(webviewRef: RefObject<WebView>, onEvent: VkVideoPlayerProps['onEvent']) {
  const eventId = useRef(0);
  const requestListeners = useRef<Map<number, (event: VkPlayerEvent) => void>>(new Map());
  const eventListeners = useRef<Map<VkVideoEventName, ((event: VkPlayerEvent) => void)[]>>(new Map());

  const getEventId = useCallback(() => eventId.current++, [eventId]);

  const injectScript = useCallback<VkPlayerInjectFn>(
    (
      idOrCreateScript: number | ((id: number) => { eventName: string; script: string }),
      scriptOrNull?: { eventName: string; script: string }
    ) => {
      const id = typeof idOrCreateScript === 'number' ? idOrCreateScript : getEventId();
      const { eventName, script } = typeof idOrCreateScript === 'function' ? idOrCreateScript(id) : scriptOrNull!;

      return new Promise<VkPlayerEvent>((resolve, reject) => {
        if (webviewRef.current == null) {
          reject(new Error('[VkVideoPlayer.injectScript] WebView not initialized'));
          return;
        }
        requestListeners.current.set(id, resolve);
        webviewRef.current.injectJavaScript(script);
        setTimeout(() => {
          if (requestListeners.current.has(id)) {
            reject(new Error(`[VkVideoPlayer.injectScript] Timeout event ${eventName} (${id})`));
            requestListeners.current.delete(id);
          }
        }, 5000);
      });
    },
    [webviewRef, requestListeners, getEventId]
  );

  const subscribeEvent = useCallback<VkVideoPlayerHandle['on']>(
    (eventName, listener) => {
      const l = listener as unknown as (event: VkPlayerEvent) => void;
      const listeners = eventListeners.current.get(eventName) || [];
      listeners.push(l);
      eventListeners.current.set(eventName, listeners);
      return () => {
        const index = listeners.indexOf(l);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
        if (listeners.length < 1) {
          eventListeners.current.delete(eventName);
        }
      };
    },
    [eventListeners]
  );

  const onVkPlayerEvent = useCallback(
    (event?: unknown) => {
      if (!checkVkPlayerEvent(event)) {
        return;
      }
      if (event.id != null) {
        requestListeners.current.get(event.id)?.(event);
        requestListeners.current.delete(event.id);
      }
      eventListeners.current.get(event.name)?.forEach((f) => f(event));
      onEvent?.(event);
    },
    [eventListeners, onEvent]
  );

  return {
    eventId,
    requestListeners,
    eventListeners,
    getEventId,
    injectScript,
    subscribeEvent,
    onVkPlayerEvent,
  };
}
