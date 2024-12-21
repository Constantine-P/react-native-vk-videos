export function createInjectScript(script: string) {
  return `
  (function() {
    ${script}
  })();
  true;
`;
}

export function createInjectInitScript(src: string, hideControls?: boolean) {
  return createInjectScript(`
  if (window.VkPlayerWebViewInited) {
    return;
  }
  window.VkPlayerWebViewInited = true;

  var script = document.createElement('script');
  script.src = "https://vk.com/js/api/videoplayer.js";
  document.head.appendChild(script);

  window.sendEvent = (name, id, data) => {
    window.ReactNativeWebView.postMessage(JSON.stringify({id, name, data}))
  }

  document.addEventListener('readystatechange', (event) => {
    if (event.target.readyState === "complete") {
      setTimeout(() => {
        if (cur.player == null) {
          var errMessage = 'Player not found. Possibly invalid src.';

          var errBox = document.querySelector('#video_ext_msg');
          if (errBox != null && errBox.textContent.trim().length > 0) {
            errMessage += '\\n\\n'+errBox.textContent.trim();
          }

          sendEvent('unknownError', null, errMessage);
        }
      }, 1000)
    }
  });

  const hideControlls = () => {
    const videoplayerUI = document.querySelector('.videoplayer_ui');
    const elements = videoplayerUI.querySelectorAll('*:not(.videoplayer_thumb)');
    elements.forEach(element => {
      element.style.opacity = '0';
    });
  }

  script.onload = function() {
    var fakeIframe = {
      contentWindow: window, // Передаем текущее окно
      src: "${src}",
    };

    try {
      window.player = VK.VideoPlayer(fakeIframe);

      player.on("inited", (state) => {
        player.mute()

        var videoEl = cur.player.media.videoEl;
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('pip', 'true');
        videoEl.addEventListener("loadeddata", () => {
          if (cur.player.media.videoEl.videoHeight > 0) {
            sendEvent('videoSize', null, {width: cur.player.media.videoEl.videoWidth, height: cur.player.media.videoEl.videoHeight})
          }
        });

        sendEvent('isLive', null, cur.player.isActiveLive());

        var availableQualities = cur.player.getAvailableQualities();
        if (availableQualities != null && availableQualities.length > 0) {
          sendEvent('availableQualities', null, availableQualities.filter((q) => q !== 0));
        }

        cur.player.on("media.waiting", (buffering, stalled) => sendEvent('mediaWaiting', null, {buffering, stalled}));

        cur.player.on("qualitiesListChange", (qualities) => {
          sendEvent('availableQualities', null, qualities.filter((q) => q !== 0))
        });
        ${hideControls ? `hideControlls()` : ''}
        sendEvent('inited', null, state);
      });

      player.on("started", (state) => {
        sendEvent('started', null, state);
      });

      player.on("resumed", (state) => {
        sendEvent('resumed', null, state);
      });

      player.on("paused", (state) => {
        sendEvent('paused', null, state);
      });

      player.on("ended", (state) => {
        sendEvent('ended', null, state);
      });

      player.on("timeupdate", (state) => {
        sendEvent('timeupdate', null, state);
      });

      player.on("qualitychange", (state) => {
        sendEvent('qualitychange', null, state);
      });

      player.on("error", (state) => {
        sendEvent('error', null, state);
      });

      player.on("adStarted", (state) => {
        sendEvent('adStarted', null, state);
      });

      player.on("adCompleted", (state) => {
        sendEvent('adCompleted', null, state);
      });
    } catch (e) {
      sendEvent('unknownError', null, e.toString());
    }
  }
`);
}

export function createInjectGetAvailableQualitiesScript(id: number) {
  return {
    eventName: 'availableQualities',
    script: createInjectScript(
      `sendEvent('availableQualities', ${id}, cur.player.getAvailableQualities().filter(q => q != 0));`
    ),
  };
}

export function createInjectPlayScript(id: number) {
  return {
    eventName: 'play',
    script: createInjectScript(`sendEvent('play', ${id}, cur.player.play() || true);`),
  };
}

export function createInjectPauseScript(id: number) {
  return {
    eventName: 'pause',
    script: createInjectScript(`sendEvent('pause', ${id}, cur.player.pause() || true);`),
  };
}

export function createInjectSetQualityScript(id: number, quality: number) {
  return {
    eventName: 'setQuality',
    script: createInjectScript(`sendEvent('setQuality', ${id}, cur.player.setQuality(${quality}) || true);`),
  };
}

export function createInjectSeekScript(id: number, time: number) {
  return {
    eventName: 'seek',
    script: createInjectScript(`sendEvent('seek', ${id}, player.seek(${time}) || true);`),
  };
}

export function createInjectSeekLiveScript(id: number) {
  return {
    eventName: 'seekLive',
    script: createInjectScript(`sendEvent('seekLive', ${id}, player.seekLive() || true);`),
  };
}

export function createInjectIsPausedScript(id: number) {
  return {
    eventName: 'isPaused',
    script: createInjectScript(`sendEvent('isPaused', ${id}, cur.player.state != 'playing');`),
  };
}
