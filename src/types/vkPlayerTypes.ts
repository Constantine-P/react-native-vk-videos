export interface VkVideoState {
  state: 'uninited' | 'unstarted' | 'playing' | 'paused' | 'ended' | 'error';
  volume: number;
  muted: boolean;
  time: number;
  duration: number;
  quality: number;
}

export enum VkVideoQuality {
  AUTO = -1,
  Q_144P = 144,
  Q_240P = 240,
  Q_360P = 360,
  Q_480P = 480,
  Q_720P = 720,
  Q_1080P = 1080,
  Q_1440P = 1440,
  Q_2160P = 2160,
}

export interface VkPlayerEvent<E extends keyof VkVideoEventData = keyof VkVideoEventData> {
  id: number | null;
  name: E;
  data: VkVideoEventData[E];
}

export enum VkVideoEventName {
  INITED = 'inited',
  TIMEUPDATE = 'timeupdate',
  VOLUMECHANGE = 'volumechange',
  QUALITYCHANGE = 'qualitychange',
  STARTED = 'started',
  RESUMED = 'resumed',
  PAUSED = 'paused',
  ENDED = 'ended',
  ERROR = 'error',
  ADSTARTED = 'adStarted',
  ADCOMPLETED = 'adCompleted',
  UNKNOWN = 'unknown',
  AVAILABLEQUALITIES = 'availableQualities',
  PLAY = 'play',
  PAUSE = 'pause',
  ISLIVE = 'isLive',
  SETQUALITY = 'setQuality',
  SEEK = 'seek',
  MEDIAWAITING = 'mediaWaiting',
  SEEKLIVE = 'seekLive',
  UNKNOWNERROR = 'unknownError',
  VIDEOSIZE = 'videoSize',
  ISPAUSED = 'isPaused',
}

export type VkVideoEventData = {
  [VkVideoEventName.INITED]: VkVideoState;
  [VkVideoEventName.TIMEUPDATE]: VkVideoState;
  [VkVideoEventName.VOLUMECHANGE]: VkVideoState;
  [VkVideoEventName.QUALITYCHANGE]: VkVideoState;
  [VkVideoEventName.STARTED]: VkVideoState;
  [VkVideoEventName.RESUMED]: VkVideoState;
  [VkVideoEventName.PAUSED]: VkVideoState;
  [VkVideoEventName.ENDED]: VkVideoState;
  [VkVideoEventName.ERROR]: VkVideoState;
  [VkVideoEventName.ADSTARTED]: VkVideoState;
  [VkVideoEventName.ADCOMPLETED]: VkVideoState;
  [VkVideoEventName.UNKNOWN]: {};
  [VkVideoEventName.AVAILABLEQUALITIES]: VkVideoQuality[];
  [VkVideoEventName.PLAY]: true;
  [VkVideoEventName.PAUSE]: true;
  [VkVideoEventName.ISLIVE]: boolean;
  [VkVideoEventName.SETQUALITY]: true;
  [VkVideoEventName.SEEK]: true;
  [VkVideoEventName.MEDIAWAITING]: { stalled: boolean; buffering: boolean };
  [VkVideoEventName.SEEKLIVE]: true;
  [VkVideoEventName.UNKNOWNERROR]: string | undefined;
  [VkVideoEventName.VIDEOSIZE]: { width: number; height: number };
  [VkVideoEventName.ISPAUSED]: boolean;
};

export type VkPlayerInjectFn = {
  <E extends keyof VkVideoEventData = VkVideoEventName.UNKNOWN>(
    id: number,
    script: { eventName: string; script: string }
  ): Promise<VkPlayerEvent<E>>;
  <E extends keyof VkVideoEventData = VkVideoEventName.UNKNOWN>(
    script: (id: number) => { eventName: string; script: string }
  ): Promise<VkPlayerEvent<E>>;
};

export function checkVkPlayerEvent(event?: unknown): event is VkPlayerEvent {
  return Object.values(VkVideoEventName).find((v) => v === (event as VkPlayerEvent)?.name) != null;
}
