import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  VkVideoEventName,
  VkVideoPlayer,
  VkVideoQuality,
  type VkVideoPlayerHandle,
} from '@procraft/react-native-vk-video';

export default function App() {
  const playerRef = useRef<VkVideoPlayerHandle>(null);

  const windowDimensions = useWindowDimensions();

  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [inited, setInited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [paused, setPaused] = useState(true);
  const [videoPaused, setVideoPaused] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(VkVideoQuality.AUTO);
  const [videoQualities, setVideoQualities] = useState<VkVideoQuality[]>([VkVideoQuality.AUTO]);

  useEffect(() => {
    const disposeres = [
      playerRef.current?.on(VkVideoEventName.AVAILABLEQUALITIES, (event) =>
        setVideoQualities([VkVideoQuality.AUTO, ...event.data])
      ),
      playerRef.current?.on(VkVideoEventName.QUALITYCHANGE, (state) =>
        setCurrentQuality(state.data.quality === 0 ? VkVideoQuality.AUTO : state.data.quality)
      ),
      playerRef.current?.on(VkVideoEventName.STARTED, () => setVideoPaused(false)),
      playerRef.current?.on(VkVideoEventName.RESUMED, () => setVideoPaused(false)),
      playerRef.current?.on(VkVideoEventName.PAUSED, () => setVideoPaused(true)),
      playerRef.current?.on(VkVideoEventName.ENDED, () => setVideoPaused(true)),
      playerRef.current?.on(VkVideoEventName.ISLIVE, ({ data }) => setIsLive(data)),
      playerRef.current?.on(VkVideoEventName.TIMEUPDATE, ({ data }) => {
        setTime(data.time);
        setDuration(data.duration);
      }),
      playerRef.current?.on(VkVideoEventName.INITED, ({ data }) => {
        setIsError(false);
        setInited(true);
        setTime(data.time);
        setDuration(data.duration);
      }),
      playerRef.current?.on(VkVideoEventName.MEDIAWAITING, ({ data }) => setLoading(data.buffering)),
      playerRef.current?.on(VkVideoEventName.ERROR, () => setIsError(true)),
      playerRef.current?.on(VkVideoEventName.UNKNOWNERROR, () => setIsError(true)),
      playerRef.current?.on(VkVideoEventName.VIDEOSIZE, ({ data }) => setAspectRatio(data.width / data.height)),
    ].filter((d) => d != null);
    return () => disposeres.forEach((d) => d());
  }, []);

  const setQuality = useCallback((quality: VkVideoQuality) => playerRef.current?.setQuality(quality), [playerRef]);
  const seek = useCallback((time: number) => playerRef.current?.seek(time), [playerRef]);
  const seekPrev = useCallback(() => seek(time - 15), [time, seek]);
  const seekNext = useCallback(() => seek(time + 15), [time, seek]);
  const seekLive = useCallback(() => playerRef.current?.seekLive(), []);
  const togglePause = useCallback(() => {
    if (isLive && time === duration) {
      seekLive();
    }
    setPaused((p) => !p);
  }, [duration, isLive, seekLive, time]);

  const sources: [name: string, src: string][] = [
    ['Video', 'https://vk.com/video_ext.php?oid=-227884247&id=456239020&hd=2&hash=0b5f32375446d22d&autoplay=1'],
    ['Live', 'https://vk.com/video_ext.php?oid=-339767&id=456244698&hd=2&autoplay=1'],
    ['Error', 'https://vk.com/video_ext.php?oid=-3397&id=456244698&hd=2&autoplay=1'],
  ];
  const [currentSource, setCurrentSource] = useState(sources[0]![1]);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {sources.map(([name, src]) => (
          <Button
            key={name}
            borderColor={currentSource === src ? 'red' : 'black'}
            onPress={() => setCurrentSource(src)}
          >
            {name}
          </Button>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            aspectRatio,
            flex: 1,
            maxHeight: windowDimensions.height / 2,
          }}
        >
          <VkVideoPlayer
            ref={playerRef}
            src={currentSource}
            hideControls
            webviewProps={{ style: { width: '100%', height: '100%' } }}
            paused={paused}
          />
        </View>
      </View>
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Text style={{ margin: 8 }}>INITED: {inited.toString()}</Text>
          <Text style={{ margin: 8 }}>LIVE: {isLive.toString()}</Text>
          <Text style={{ margin: 8 }}>LOADING: {loading.toString()}</Text>
          <Text style={{ margin: 8 }}>ERROR: {isError.toString()}</Text>
          <Text style={{ margin: 8 }}>PAUSED: {videoPaused.toString()}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Button onPress={togglePause}>{paused ? 'Play' : 'Pause'}</Button>
          {isLive && (
            <Button borderColor={time === duration ? 'red' : 'black'} onPress={seekLive}>
              Live
            </Button>
          )}
          <View
            style={{
              margin: 8,
              borderRadius: 8,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Pressable onPress={seekPrev}>
              <Text style={{ padding: 8 }}>-15</Text>
            </Pressable>
            <Text style={{ margin: 8 }}>
              {formatTime(time)} / {formatTime(duration)}
            </Text>
            <Pressable onPress={seekNext}>
              <Text style={{ padding: 8 }}>+15</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {videoQualities.map((quality) => (
            <Button
              key={quality}
              borderColor={currentQuality === quality ? 'red' : 'black'}
              onPress={() => setQuality(quality)}
            >
              {QualityLabels[quality]}
            </Button>
          ))}
        </View>
      </View>
    </View>
  );
}

interface ButtonProps {
  borderColor?: string;
  children: string;
  onPress: () => void;
}

function Button(props: ButtonProps) {
  const { borderColor, children, onPress } = props;

  return (
    <Pressable
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor,
        padding: 8,
        margin: 8,
      }}
      onPress={onPress}
    >
      <Text>{children}</Text>
    </Pressable>
  );
}

const QualityLabels: { [key in VkVideoQuality]: string } = {
  [VkVideoQuality.AUTO]: 'AUTO',
  [VkVideoQuality.Q_144P]: '144p',
  [VkVideoQuality.Q_240P]: '240p',
  [VkVideoQuality.Q_360P]: '360p',
  [VkVideoQuality.Q_480P]: '480p',
  [VkVideoQuality.Q_720P]: '720p',
  [VkVideoQuality.Q_1080P]: '1080p',
  [VkVideoQuality.Q_1440P]: '1440p',
  [VkVideoQuality.Q_2160P]: '2160p',
};

function formatTime(time: number) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time / 60) % 60);
  const seconds = Math.floor(time % 60);

  let timeFormatted = '';
  if (hours > 0) {
    timeFormatted += `${hours}:`;
  }
  timeFormatted += `${minutes.toString().padStart(hours > 0 ? 2 : 1, '0')}:`;
  timeFormatted += `${seconds.toString().padStart(2, '0')}`;

  return timeFormatted;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
