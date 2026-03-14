const WS_URL = "ws://127.0.0.1:9998";

function findTwitchTab(tabs) {
  return tabs.find((t) => t.active) ?? tabs[0];
}

function toggleMute() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = findTwitchTab(tabs);
    chrome.tabs.update(tab.id, { muted: !tab.mutedInfo.muted });
  });
}

function togglePause() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = findTwitchTab(tabs);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const video = document.querySelector("video");
        if (!video) return;
        video.paused ? video.play() : video.pause();
      },
    });
  });
}

function nextTab() {
  chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
    if (tabs.length === 0) return;

    // Sort tabs consistently by window and position
    tabs.sort((a, b) => a.windowId - b.windowId || a.index - b.index);

    const currentIdx = tabs.findIndex((t) => t.active);
    const nextIdx = (currentIdx + 1) % tabs.length;
    const next = tabs[nextIdx];

    chrome.tabs.update(next.id, { active: true });
  });
}

// WebSocket connection to local server
function connectWebSocket() {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => console.log("Connected to local server");

  ws.onmessage = (event) => {
    if (event.data === "mute") toggleMute();
    if (event.data === "pause") togglePause();
    if (event.data === "next") nextTab();
  };

  ws.onclose = () => {
    console.log("Disconnected, retrying in 3s...");
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = () => ws.close();
}

connectWebSocket();

// Keep hotkeys working too
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-twitch-mute") toggleMute();
  if (command === "toggle-twitch-pause") togglePause();
  if (command === "next-twitch-tab") nextTab();
});
