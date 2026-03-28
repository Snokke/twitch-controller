import streamDeck, { action, SingletonAction } from '@elgato/streamdeck';
import WebSocket from 'ws';

class TwitchConnection {
    ws = null;
    url;
    reconnectTimer;
    listeners = new Set();
    _lastState = null;
    get lastState() {
        return this._lastState;
    }
    constructor(url) {
        this.url = url;
        this.connect();
    }
    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN))
            return;
        try {
            this.ws = new WebSocket(this.url);
            this.ws.on("open", () => {
                streamDeck.logger.info("Connected to Twitch controller server");
                this.ws.send(JSON.stringify({ type: "register", role: "streamdeck" }));
                if (this.reconnectTimer) {
                    clearInterval(this.reconnectTimer);
                    this.reconnectTimer = undefined;
                }
            });
            this.ws.on("message", (data) => {
                try {
                    const msg = JSON.parse(String(data));
                    if (msg.type === "state") {
                        this._lastState = msg;
                        for (const listener of this.listeners) {
                            listener(this._lastState);
                        }
                    }
                }
                catch {
                    streamDeck.logger.warn(`Unparseable message: ${data}`);
                }
            });
            this.ws.on("close", () => {
                streamDeck.logger.warn("Disconnected from server, reconnecting...");
                this.ws = null;
                this.scheduleReconnect();
            });
            this.ws.on("error", () => {
                this.ws?.close();
            });
        }
        catch {
            this.scheduleReconnect();
        }
    }
    scheduleReconnect() {
        if (!this.reconnectTimer) {
            this.reconnectTimer = setInterval(() => this.connect(), 3000);
        }
    }
    reconnect() {
        this.ws?.close();
        this.ws = null;
        this.connect();
    }
    send(command) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "command", command }));
        }
    }
    onState(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
}
function __runInitializers(thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
}
typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

let cachedUrl = "";
let cachedBase64 = "";
async function getAvatarBase64(url) {
    if (!url) {
        streamDeck.logger.debug("No avatar URL provided");
        return "";
    }
    if (url === cachedUrl && cachedBase64)
        return cachedBase64;
    try {
        streamDeck.logger.info(`Fetching avatar: ${url}`);
        const res = await fetch(url);
        if (!res.ok) {
            streamDeck.logger.warn(`Avatar fetch failed: ${res.status}`);
            return "";
        }
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const contentType = res.headers.get("content-type") || "image/png";
        cachedUrl = url;
        cachedBase64 = `data:${contentType};base64,${base64}`;
        return cachedBase64;
    }
    catch (e) {
        streamDeck.logger.warn(`Failed to fetch avatar: ${e}`);
        return "";
    }
}

let MuteAction = (() => {
    let _classDecorators = [action({ UUID: "com.snake.twitch-controller.mute" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    (class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        conn;
        constructor(conn) {
            super();
            this.conn = conn;
            this.conn.onState((state) => this.updateAll(state));
        }
        async onKeyDown() {
            this.conn.send("mute");
        }
        async onWillAppear(ev) {
            const state = this.conn.lastState;
            if (state)
                this.setIcon(ev.action, state);
        }
        updateAll(state) {
            for (const a of this.actions) {
                this.setIcon(a, state);
            }
        }
        async setIcon(action, state) {
            if (!state.active) {
                action.setImage("imgs/actions/mute/key");
                action.setTitle("");
                return;
            }
            const muted = state.muted ?? false;
            const avatarData = await getAvatarBase64(state.avatar ?? "");
            if (avatarData) {
                const color = muted ? "#e74c3c" : "#2ecc71";
                const label = muted ? "MUTED" : "ON";
                const symbol = muted ? "M" : "\u266A";
                const svg = `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image href="${avatarData}" x="0" y="0" width="144" height="144"/>
        <rect x="0" y="94" width="144" height="50" fill="rgba(0,0,0,0.7)"/>
        <circle cx="72" cy="48" r="28" fill="${color}" opacity="0.85"/>
        <text x="72" y="56" text-anchor="middle" fill="white" font-size="24" font-family="Arial" font-weight="bold">${symbol}</text>
        <text x="72" y="126" text-anchor="middle" fill="${color}" font-size="20" font-family="Arial" font-weight="bold">${label}</text>
      </svg>`;
                action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
            }
            else {
                action.setImage(muted ? "imgs/actions/mute/key-off" : "imgs/actions/mute/key-on");
            }
            action.setTitle("");
        }
    });
    return _classThis;
})();

let PauseAction = (() => {
    let _classDecorators = [action({ UUID: "com.snake.twitch-controller.pause" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    (class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        conn;
        constructor(conn) {
            super();
            this.conn = conn;
            this.conn.onState((state) => this.updateAll(state));
        }
        async onKeyDown() {
            this.conn.send("pause");
        }
        async onWillAppear(ev) {
            const state = this.conn.lastState;
            if (state)
                this.setIcon(ev.action, state);
        }
        updateAll(state) {
            for (const a of this.actions) {
                this.setIcon(a, state);
            }
        }
        async setIcon(action, state) {
            if (!state.active) {
                action.setImage("imgs/actions/pause/key");
                action.setTitle("");
                return;
            }
            const paused = state.paused ?? false;
            const avatarData = await getAvatarBase64(state.avatar ?? "");
            if (avatarData) {
                const color = paused ? "#e67e22" : "#2ecc71";
                const symbol = paused ? "\u275A\u275A" : "\u25B6";
                const label = paused ? "PAUSED" : "LIVE";
                const svg = `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image href="${avatarData}" x="0" y="0" width="144" height="144"/>
        <rect x="0" y="94" width="144" height="50" fill="rgba(0,0,0,0.7)"/>
        <circle cx="72" cy="48" r="28" fill="${color}" opacity="0.85"/>
        <text x="72" y="58" text-anchor="middle" fill="white" font-size="26" font-family="Arial" font-weight="bold">${symbol}</text>
        <text x="72" y="126" text-anchor="middle" fill="${color}" font-size="20" font-family="Arial" font-weight="bold">${label}</text>
      </svg>`;
                action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
            }
            else {
                action.setImage(paused ? "imgs/actions/pause/key-off" : "imgs/actions/pause/key-on");
            }
            action.setTitle("");
        }
    });
    return _classThis;
})();

let NextAction = (() => {
    let _classDecorators = [action({ UUID: "com.snake.twitch-controller.next" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    (class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        conn;
        constructor(conn) {
            super();
            this.conn = conn;
            this.conn.onState((state) => this.updateAll(state));
        }
        async onKeyDown() {
            this.conn.send("next");
        }
        async onWillAppear(ev) {
            const state = this.conn.lastState;
            if (state)
                this.setIcon(ev.action, state);
        }
        updateAll(state) {
            for (const a of this.actions) {
                this.setIcon(a, state);
            }
        }
        setIcon(action, state) {
            const channel = state.active ? (state.channel ?? "") : "";
            if (!channel) {
                action.setImage("imgs/actions/next/key");
                action.setTitle("");
                return;
            }
            // Dynamic SVG only to show channel name
            const displayName = channel.length > 8 ? channel.slice(0, 7) + "\u2026" : channel;
            const svg = `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg">
      <rect width="144" height="144" rx="20" fill="#1a1a2e"/>
      <circle cx="72" cy="64" r="35" fill="#9b59b6" opacity="0.9"/>
      <text x="72" y="74" text-anchor="middle" fill="white" font-size="36" font-family="Arial" font-weight="bold">\u23ED</text>
      <text x="72" y="128" text-anchor="middle" fill="#bb86fc" font-size="16" font-family="Arial">${displayName}</text>
    </svg>`;
            action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
            action.setTitle("");
        }
    });
    return _classThis;
})();

let ChatAction = (() => {
    let _classDecorators = [action({ UUID: "com.snake.twitch-controller.chat" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    (class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        conn;
        constructor(conn) {
            super();
            this.conn = conn;
            this.conn.onState((state) => this.updateAll(state));
        }
        async onKeyDown() {
            this.conn.send("chat");
        }
        async onWillAppear(ev) {
            const state = this.conn.lastState;
            if (state)
                this.setIcon(ev.action, state);
        }
        updateAll(state) {
            for (const a of this.actions) {
                this.setIcon(a, state);
            }
        }
        setIcon(action, state) {
            if (!state.active) {
                action.setImage("imgs/actions/chat/key");
                action.setTitle("");
                return;
            }
            const chatOpen = state.chat ?? true;
            action.setImage(chatOpen ? "imgs/actions/chat/key-on" : "imgs/actions/chat/key-off");
            action.setTitle("");
        }
    });
    return _classThis;
})();

let TheaterAction = (() => {
    let _classDecorators = [action({ UUID: "com.snake.twitch-controller.theater" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    (class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        conn;
        constructor(conn) {
            super();
            this.conn = conn;
            this.conn.onState((state) => this.updateAll(state));
        }
        async onKeyDown() {
            this.conn.send("theater");
        }
        async onWillAppear(ev) {
            const state = this.conn.lastState;
            if (state)
                this.setIcon(ev.action, state);
        }
        updateAll(state) {
            for (const a of this.actions) {
                this.setIcon(a, state);
            }
        }
        setIcon(action, state) {
            if (!state.active) {
                action.setImage("imgs/actions/theater/key");
                action.setTitle("");
                return;
            }
            const theaterOn = state.theater ?? false;
            action.setImage(theaterOn ? "imgs/actions/theater/key-on" : "imgs/actions/theater/key-off");
            action.setTitle("");
        }
    });
    return _classThis;
})();

let VolumeUpAction = (() => {
    let _classDecorators = [action({ UUID: "com.snake.twitch-controller.volumeup" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    (class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        conn;
        constructor(conn) {
            super();
            this.conn = conn;
            this.conn.onState((state) => this.updateAll(state));
        }
        async onKeyDown() {
            this.conn.send("volumeup");
        }
        async onWillAppear(ev) {
            const state = this.conn.lastState;
            if (state)
                this.setIcon(ev.action, state);
        }
        updateAll(state) {
            for (const a of this.actions) {
                this.setIcon(a, state);
            }
        }
        setIcon(action, state) {
            if (!state.active) {
                action.setImage("imgs/actions/volume-up/key");
                action.setTitle("");
                return;
            }
            // Dynamic SVG to show current volume %
            const volume = state.volume ?? 100;
            const svg = `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg">
      <rect width="144" height="144" rx="20" fill="#1a1a2e"/>
      <circle cx="72" cy="64" r="35" fill="#2ecc71" opacity="0.9"/>
      <text x="72" y="74" text-anchor="middle" fill="white" font-size="36" font-family="Arial" font-weight="bold">+</text>
      <text x="72" y="128" text-anchor="middle" fill="#2ecc71" font-size="18" font-family="Arial">${volume}%</text>
    </svg>`;
            action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
            action.setTitle("");
        }
    });
    return _classThis;
})();

let VolumeDownAction = (() => {
    let _classDecorators = [action({ UUID: "com.snake.twitch-controller.volumedown" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    (class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        conn;
        constructor(conn) {
            super();
            this.conn = conn;
            this.conn.onState((state) => this.updateAll(state));
        }
        async onKeyDown() {
            this.conn.send("volumedown");
        }
        async onWillAppear(ev) {
            const state = this.conn.lastState;
            if (state)
                this.setIcon(ev.action, state);
        }
        updateAll(state) {
            for (const a of this.actions) {
                this.setIcon(a, state);
            }
        }
        setIcon(action, state) {
            if (!state.active) {
                action.setImage("imgs/actions/volume-down/key");
                action.setTitle("");
                return;
            }
            // Dynamic SVG to show current volume %
            const volume = state.volume ?? 100;
            const svg = `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg">
      <rect width="144" height="144" rx="20" fill="#1a1a2e"/>
      <circle cx="72" cy="64" r="35" fill="#e74c3c" opacity="0.9"/>
      <text x="72" y="76" text-anchor="middle" fill="white" font-size="44" font-family="Arial" font-weight="bold">-</text>
      <text x="72" y="128" text-anchor="middle" fill="#e74c3c" font-size="18" font-family="Arial">${volume}%</text>
    </svg>`;
            action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
            action.setTitle("");
        }
    });
    return _classThis;
})();

let CloseAction = (() => {
    let _classDecorators = [action({ UUID: "com.snake.twitch-controller.close" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    (class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        conn;
        constructor(conn) {
            super();
            this.conn = conn;
        }
        async onKeyDown() {
            this.conn.send("close");
        }
    });
    return _classThis;
})();

let CloseAllAction = (() => {
    let _classDecorators = [action({ UUID: "com.snake.twitch-controller.closeall" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SingletonAction;
    (class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        conn;
        constructor(conn) {
            super();
            this.conn = conn;
        }
        async onKeyDown() {
            this.conn.send("closeall");
        }
    });
    return _classThis;
})();

streamDeck.logger.setLevel("debug");
const conn = new TwitchConnection("ws://127.0.0.1:9998");
streamDeck.actions.registerAction(new MuteAction(conn));
streamDeck.actions.registerAction(new PauseAction(conn));
streamDeck.actions.registerAction(new NextAction(conn));
streamDeck.actions.registerAction(new ChatAction(conn));
streamDeck.actions.registerAction(new TheaterAction(conn));
streamDeck.actions.registerAction(new VolumeUpAction(conn));
streamDeck.actions.registerAction(new VolumeDownAction(conn));
streamDeck.actions.registerAction(new CloseAction(conn));
streamDeck.actions.registerAction(new CloseAllAction(conn));
// Reconnect when system wakes from sleep
streamDeck.system.onSystemDidWakeUp(() => {
    conn.reconnect();
});
streamDeck.connect();
//# sourceMappingURL=plugin.js.map
