# Virtual Tabletop Next: Detailed Design

This document expands on the project plan found in `README.md` and lays out more specific guidance for building the MVP. Each core module below lists dependencies, design decisions, and success criteria. The focus is on a small, maintainable application that can be iterated on easily.

## 1. Map Loading

**Purpose**: Allow the GM to upload a map image and share it with connected players.

### Design Decisions
- Maps are uploaded as image files (PNG or JPEG) and stored on the server's filesystem or object storage.
- The map metadata (URL, width, height) is stored in the database and associated with a `Session`.
- Only the GM can change the map for an active session. Clients automatically fetch the map when they join.
- Map images are not modified by the application—no tiling or slicing to start with.

### Dependencies
- Express for handling file uploads via `multer` or a similar middleware.
- Prisma models for `Map` and `Session` (already sketched in the README).
- Client uses React components and `Konva` to display the map.

### Success Criteria
- GM can upload a map from the web client.
- Map is stored on the server and referenced in the database.
- All connected clients view the same map in real time.
- Map persists when the session reloads.

## 2. Token Management

**Purpose**: Tokens represent characters or objects on the map. Players and the GM can move tokens, and the GM can create or remove them.

### Design Decisions
- Token state (position, size, name) is held in memory on the server and synced to clients via `socket.io`.
- Persistent storage uses the `Token` model from the README. Changes are periodically saved to the database.
- Only the GM can create or delete tokens. Players may move tokens they own.
- Token images can be static icons at first. Future versions may allow custom images.

### Dependencies
- `socket.io` for broadcasting token updates.
- Prisma models for tokens.
- Konva shapes on the client for drag-and-drop behavior.

### Success Criteria
- GM can add and remove tokens.
- Token positions update in real time for all clients when moved.
- Ownership restrictions prevent players from moving unauthorized tokens.
- Token data is persisted and restored when the session reconnects.

## 3. Initiative Tracker

**Purpose**: Provide a simple turn order list during combat.

### Design Decisions
- The initiative list is a simple array of token IDs stored with the session.
- GM can set or modify initiative values; clients receive updates via WebSocket.
- The tracker UI is a vertical list with controls to advance the turn and reorder entries.

### Dependencies
- React state to display and edit the initiative order.
- Socket events for initiative updates (`initiative:update`, `initiative:next` etc.).
- Database field `initiative` on the `Token` model for persistence.

### Success Criteria
- GM can enter initiative values for each token.
- Clients see the list update immediately when modified.
- There is a button to advance to the next token in the list.

## 4. Real-time Sync

**Purpose**: Keep all clients in sync with the current game state (map, tokens, initiative).

### Design Decisions
- `socket.io` rooms are used to group clients by session.
- Server maintains an in-memory representation of each session's state. On reconnect, clients fetch the latest state via a REST endpoint.
- Minimal event types: `map:update`, `token:create`, `token:update`, `token:delete`, `initiative:update`.
- Heartbeats or pings keep connections alive; if a client disconnects, they can rejoin and restore state.

### Dependencies
- `socket.io` server and client packages.
- Express routes for initial state fetch and authentication.

### Success Criteria
- When any player moves a token or the GM changes the map, all clients reflect the change within a second.
- If a client refreshes the page, they see the latest state immediately.
- WebSocket connections handle up to five concurrent users (one GM + four players) without noticeable lag.

## Additional Considerations

### Authentication
- Simple username plus session code. No persistent accounts required.
- Session code is generated when a GM creates a new session.

### Development Environment
- Use `docker-compose` for local development: one service for the Node server, one for PostgreSQL, one for the React client.
- A script seeds the database with a default GM user and a sample session for testing.

### Stretch Goals (For Reference)
- Dice roller integrated with chat messages.
- Basic drawing layer over the map.
- Fog of war or visibility controls.

## Milestones

1. **Setup** – Repository scaffolded with client and server packages, linting, and TypeScript configurations.
2. **Map & Token MVP** – Upload/display map, create/move tokens with real-time sync.
3. **Initiative Tracker** – Editable initiative list synced across clients.
4. **Persistence & Auth** – Database models solidified, simple login/join flow implemented.
5. **Polish** – UI improvements, error handling, and documentation.

The project should deliver a minimal but functional tabletop that supports a single game master running sessions for a small group.

