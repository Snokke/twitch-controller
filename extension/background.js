const WS_URL = "ws://127.0.0.1:9998";

function findTwitchTab(tabs) {
  return tabs.find((t) => t.active) ?? tabs[0];
}

function queryTwitchTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => resolve(tabs || []));
  });
}

// --- Actions ---

function toggleMute() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = findTwitchTab(tabs);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const btn = document.querySelector('button[data-a-target="player-mute-unmute-button"]');
        if (btn) btn.click();
      },
    }, () => {
      setTimeout(sendState, 200);
    });
  });
}

function togglePause() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = findTwitchTab(tabs);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const btn = document.querySelector('button[data-a-target="player-play-pause-button"]');
        if (btn) btn.click();
      },
    }, () => {
      setTimeout(sendState, 200);
    });
  });
}

function nextTab() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    tabs.sort((a, b) => a.windowId - b.windowId || a.index - b.index);
    const currentIdx = tabs.findIndex((t) => t.active);
    const nextIdx = (currentIdx + 1) % tabs.length;
    const next = tabs[nextIdx];
    chrome.tabs.update(next.id, { active: true }, () => {
      setTimeout(sendState, 300);
    });
  });
}

function toggleChat() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = findTwitchTab(tabs);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const btn = document.querySelector('button[data-a-target="right-column__toggle-collapse-btn"]');
        if (btn) btn.click();
      },
    }, () => {
      setTimeout(sendState, 200);
    });
  });
}

function toggleTheater() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = findTwitchTab(tabs);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const btn = document.querySelector('button[aria-label*="Theatre"]');
        if (btn) btn.click();
      },
    }, () => {
      setTimeout(sendState, 200);
    });
  });
}

function volumeUp() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = findTwitchTab(tabs);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const video = document.querySelector("video");
        if (!video) return;
        video.volume = Math.min(1, video.volume + 0.1);
      },
    }, () => {
      setTimeout(sendState, 100);
    });
  });
}

function volumeDown() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = findTwitchTab(tabs);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const video = document.querySelector("video");
        if (!video) return;
        video.volume = Math.max(0, video.volume - 0.1);
      },
    }, () => {
      setTimeout(sendState, 100);
    });
  });
}

function closeTab() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = findTwitchTab(tabs);
    chrome.tabs.remove(tab.id, () => {
      setTimeout(sendState, 200);
    });
  });
}

function closeAllTabs() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const ids = tabs.map((t) => t.id);
    chrome.tabs.remove(ids, () => {
      setTimeout(sendState, 200);
    });
  });
}

// --- State reporting ---

function sendState() {
  queryTwitchTabs().then((tabs) => {
    if (tabs.length === 0) {
      sendMessage({ type: "state", active: false });
      return;
    }
    const tab = findTwitchTab(tabs);

    // Extract channel name from URL: https://www.twitch.tv/channelname
    let channel = "";
    try {
      const url = new URL(tab.url);
      channel = url.pathname.split("/").filter(Boolean)[0] || "";
    } catch {}

    // Get page state via content script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const video = document.querySelector("video");
        const muted = video ? video.muted : false;
        const paused = video ? video.paused : false;
        const chatCollapsed = document.querySelector(".right-column--collapsed") !== null;
        const theaterLabel = document.querySelector('button[aria-label*="Theatre"]')?.getAttribute("aria-label") || "";
        const theater = theaterLabel.includes("Exit");
        const volume = video ? Math.round(video.volume * 100) : 100;
        const avatar = document.querySelector('.channel-info-content img')?.src || "";
        return { muted, paused, chatCollapsed, theater, volume, avatar };
      },
    }, (results) => {
      const pageState = results?.[0]?.result || {};
      sendMessage({
        type: "state",
        active: true,
        muted: pageState.muted ?? false,
        paused: pageState.paused ?? false,
        channel,
        chat: !pageState.chatCollapsed,
        theater: pageState.theater ?? false,
        volume: pageState.volume ?? 100,
        avatar: pageState.avatar ?? "",
      });
    });
  });
}

function sendMessage(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

// --- Command dispatch ---

const commands = {
  mute: toggleMute,
  pause: togglePause,
  next: nextTab,
  chat: toggleChat,
  theater: toggleTheater,
  volumeup: volumeUp,
  volumedown: volumeDown,
  close: closeTab,
  closeall: closeAllTabs,
  getState: sendState,
};

function handleCommand(cmd) {
  const fn = commands[cmd];
  if (fn) fn();
}

// --- WebSocket connection ---

let ws = null;

function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("Connected to local server");
    // Register as extension
    ws.send(JSON.stringify({ type: "register", role: "extension" }));
    // Send initial state
    sendState();
  };

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      // Legacy plain-text command
      handleCommand(event.data);
      return;
    }

    if (msg.type === "command" && msg.command) {
      handleCommand(msg.command);
    }
  };

  ws.onclose = () => {
    console.log("Disconnected, retrying in 3s...");
    ws = null;
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = () => ws.close();
}

// Keep the service worker alive
chrome.alarms.create("keepAlive", { periodInMinutes: 0.4 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") connectWebSocket();
});

// Periodic state sync every 5 seconds
chrome.alarms.create("stateSync", { periodInMinutes: 5 / 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "stateSync") sendState();
});

connectWebSocket();

// Keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-twitch-mute") toggleMute();
  if (command === "toggle-twitch-pause") togglePause();
  if (command === "next-twitch-tab") nextTab();
});
