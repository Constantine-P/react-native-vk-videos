import { forwardRef, useImperativeHandle, useRef } from 'react';
import WebView from 'react-native-webview';
import { useVkPlayerEvents } from '../hooks/useVkPlayerEvents';
import { useVkPlayerWebView } from '../hooks/useVkPlayerWebView';
import type { VkVideoEventName } from '../types/vkPlayerTypes';
import type { VkVideoPlayerHandle, VkVideoPlayerProps } from '../types/VkVideoPlayerTypes';
import {
  createInjectGetAvailableQualitiesScript,
  createInjectSeekLiveScript,
  createInjectSeekScript,
  createInjectSetQualityScript,
} from '../utils/injectScript';

export const VkVideoPlayer = forwardRef<VkVideoPlayerHandle, VkVideoPlayerProps>(function VkVideoPlayer(props, ref) {
  const { webviewProps, onEvent } = props;

  const webviewRef = useRef<WebView>(null);

  const { injectScript, subscribeEvent, onVkPlayerEvent } = useVkPlayerEvents(webviewRef, onEvent);

  useImperativeHandle(ref, () => ({
    getAvailableQualities: async () => {
      const response = await injectScript<VkVideoEventName.AVAILABLEQUALITIES>(createInjectGetAvailableQualitiesScript);
      return response.data;
    },
    on: subscribeEvent,
    setQuality: (quality) => injectScript((id: number) => createInjectSetQualityScript(id, quality)).then(() => {}),
    seek: (time) => injectScript((id: number) => createInjectSeekScript(id, time)).then(() => {}),
    seekLive: () => injectScript(createInjectSeekLiveScript).then(() => {}),
  }));

  const { modifiedSrc, injectInitScript, onMessage } = useVkPlayerWebView(
    props,
    injectScript,
    subscribeEvent,
    onVkPlayerEvent
  );

  return (
    <WebView
      {...webviewProps}
      ref={webviewRef}
      source={{ uri: modifiedSrc }}
      javaScriptEnabled={true}
      injectedJavaScript={injectInitScript}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo={true}
      onMessage={onMessage}
    />
  );
});
