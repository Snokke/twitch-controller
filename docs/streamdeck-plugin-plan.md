# Плагин Stream Deck — План

## Цель

Плагин Stream Deck для управления вкладками Twitch. Плагин подключается к локальному Node.js серверу через WebSocket и предоставляет кнопки с динамическими иконками, отражающими текущее состояние.

## Архитектура

```
Stream Deck Plugin ←WebSocket→ Node.js Server (9998) ←WebSocket→ Chrome Extension → Twitch
```

Плагин подключается как WebSocket-клиент к серверу. VBS/BAT скрипты остаются как альтернативный способ управления.

## Протокол

- Плагин → Сервер: `{ "type": "command", "command": "mute" }`
- Расширение → Сервер: `{ "type": "state", "muted": true, "paused": false, "channel": "shroud", "chat": true, "theater": false, "volume": 80, "avatar": "https://..." }`
- Сервер → Плагин: пересылает JSON состояния как есть
- Регистрация при подключении: `{ "type": "register", "role": "extension" | "streamdeck" }`

---

## Реализованные действия (9 кнопок)

| Действие      | Команда      | Описание                           | Обратная связь                         | Статус |
|--------------|-------------|------------------------------------|-----------------------------------------|--------|
| Mute         | `mute`       | Вкл/выкл звук в плеере Twitch      | Аватарка канала + иконка muted/unmuted  | done   |
| Pause        | `pause`      | Пауза/воспроизведение стрима        | Аватарка канала + иконка playing/paused | done   |
| Next         | `next`       | Переключение на следующую вкладку   | Название канала на кнопке               | done   |
| Chat         | `chat`       | Показать/скрыть панель чата         | Иконка открыт / закрыт                 | done   |
| Theater      | `theater`    | Переключение театрального режима    | Иконка вкл / выкл                      | done   |
| Volume Up    | `volumeup`   | Громкость +10%                     | Текущий % на кнопке                    | done   |
| Volume Down  | `volumedown` | Громкость -10%                     | Текущий % на кнопке                    | done   |
| Close Tab    | `close`      | Закрыть текущую вкладку Twitch      | —                                       | done   |
| Close All    | `closeall`   | Закрыть все вкладки Twitch          | —                                       | done   |

### Убрано

- **Fullscreen** — Chrome блокирует программный вызов fullscreen без реального пользовательского жеста.

---

## Что сделано

### Шаг 1. Сервер — done

**Файл:** `server/server.js`

- WebSocket-клиенты разделены по ролям: `extension` / `streamdeck`
- Команды от плагина пересылаются в расширение
- Состояние от расширения сохраняется и пересылается в плагин
- HTTP-эндпоинты для всех команд (обратная совместимость с VBS/BAT)

### Шаг 2. Chrome-расширение — done

**Файл:** `extension/background.js`

- Все команды работают через клик по нативным кнопкам Twitch UI (data-a-target / aria-label)
- Мут через плеер (`player-mute-unmute-button`), не через `chrome.tabs.update`
- Пауза через плеер (`player-play-pause-button`)
- Theater через `button[aria-label*="Theatre"]`
- Chat через `right-column__toggle-collapse-btn`
- Volume через `video.volume`
- Состояние отправляется после каждой команды + периодически каждые 5 сек
- Включает URL аватарки канала в state (`.channel-info-content img`)

### Шаг 3. Плагин Stream Deck — done

**Папка:** `streamdeck-plugin/` → `com.snake.twitch-controller.sdPlugin/`

**Стек:** TypeScript, `@elgato/streamdeck` SDK v2, `ws` для WebSocket

- 9 action-классов
- `TwitchConnection` — WebSocket-клиент с автореконнектом (3 сек) и `systemDidWakeUp`
- `AvatarCache` — загрузка и кэширование аватарки канала (base64)
- Динамические SVG-иконки с состоянием
- Mute и Pause показывают аватарку канала на фоне
- Установка через junction в `%APPDATA%\Elgato\StreamDeck\Plugins\`

### Шаг 4. Иконки — done

Все иконки лежат в `streamdeck-plugin/com.snake.twitch-controller.sdPlugin/imgs/`.

#### Иконки плагина

| Файл | Размер | Назначение |
|------|--------|------------|
| `plugin/plugin.svg` | 512x512 | Иконка плагина в списке плагинов Stream Deck |
| `plugin/category.svg` | 56x56 | Иконка категории в панели действий Stream Deck |

#### Иконки действий

Каждое действие имеет иконки в своей папке `actions/<name>/`:

| Файл | Размер | Назначение |
|------|--------|------------|
| `icon.svg` | 40x40 | Иконка действия в списке/панели приложения Stream Deck |
| `key.svg` | 144x144 | Дефолтная иконка на кнопке (до получения состояния) |
| `key-on.svg` | 144x144 | Состояние "включено" (есть у mute, pause, chat, theater) |
| `key-off.svg` | 144x144 | Состояние "выключено" (есть у mute, pause, chat, theater) |

Папки действий: `mute`, `pause`, `next`, `chat`, `theater`, `volume-up`, `volume-down`, `close`, `close-all`.

#### Логика отображения иконок

| Действие | Как отображается |
|----------|-----------------|
| **Mute** | Если есть аватарка канала — динамический SVG (аватарка + статус поверх). Иначе — `key-on.svg` / `key-off.svg` |
| **Pause** | Аналогично Mute — аватарка или `key-on.svg` / `key-off.svg` |
| **Chat** | Переключение между `key-on.svg` / `key-off.svg` |
| **Theater** | Переключение между `key-on.svg` / `key-off.svg` |
| **Next** | Динамический SVG с названием канала, fallback — `key.svg` |
| **Volume Up/Down** | Динамический SVG с текущим % громкости, fallback — `key.svg` |
| **Close / Close All** | Статичная `key.svg` (нет состояний) |

Чтобы заменить иконки — достаточно обновить SVG-файлы, пересборка плагина не нужна (кроме Mute, Pause, Next, Volume — у них динамическая часть в коде).

Статические `key.svg` используются только как fallback до первого получения состояния от сервера.

---

## Будущие идеи

### Move to Monitor — перенос вкладок Twitch на второй монитор

Кнопка, которая:
1. Находит все вкладки Twitch в Chrome
2. Создаёт новое окно Chrome (`chrome.windows.create()`)
3. Переносит вкладки в это окно (`chrome.tabs.move()`)
4. Перемещает окно на второй монитор (`chrome.windows.update()` с координатами из `chrome.system.display.getInfo()`)

**Требуется:** добавить permission `system.display` в manifest расширения.

**Статус:** запланировано
