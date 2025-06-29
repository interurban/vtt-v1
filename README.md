# Virtual Tabletop Next: Project Plan

This repository outlines the design for a lightweight virtual tabletop (VTT) aimed at a single GM and up to four players. The goal is to keep the core feature set small while leaving room for future expansion.

## Inspiration

This project is influenced by the [Owlbear Rodeo 1.0](https://github.com/owlbear-rodeo/owlbear-rodeo-legacy) codebase. While that project provided a complete VTT, this repo focuses on reimplementing only the essentials using modern tooling.

## MVP Features

1. **Map Loading** – GM can upload or select a background map. Players view the same map in real time.
2. **Token Management** – Create and move tokens (drag-and-drop). Simple visibility/ownership rules.
3. **Initiative Tracker** – Basic turn order list editable by the GM.
4. **Real‑time Sync** – Changes broadcast via WebSocket to all connected clients.

These four items form the minimum viable product. The rest can be prioritized as stretch goals.

## Stretch Features (Optional)

- Fog of War or token visibility controls
- Drawing/annotation tools on the map
- Built‑in dice roller
- Audio/video chat using WebRTC
- Saving/loading multiple encounters

Any of these can be dropped to keep the scope small.

## Tech Stack

- **Frontend** – React + TypeScript using Vite for fast builds. State managed with React Context.
- **Canvas/Rendering** – [Konva](https://konvajs.org/) for 2D canvas interactions (tokens, map panning/zooming).
- **Backend** – Node.js with Express and `socket.io` for WebSocket messaging.
- **Database** – PostgreSQL accessed via Prisma. In development an in-memory store can be used.

## High‑Level Modules

```
/clients
  └─ web               – React app for GM/players
/server
  ├─ api               – REST endpoints (auth, maps, tokens)
  ├─ realtime          – socket.io handlers
  └─ db                – Prisma models and migrations
```

### Server Modules

- **Game Session** – Tracks a game room, connected players, and map/token state in memory. Persists to DB periodically.
- **Auth** – Simple username + room password. No complicated user management to start.
- **Map Service** – Stores metadata and file paths to uploaded maps.
- **Token Service** – CRUD operations on tokens plus initiative order.

### Client Modules

- **Map Canvas** – Loads map image and renders tokens on a Konva stage.
- **Token Palette** – UI for adding/removing tokens.
- **Initiative Panel** – Editable list of combat order.
- **Network Client** – Wraps socket.io to receive updates from the server.

## Database Sketch

Using Prisma, tables might look like:

```prisma
model User {
  id       String   @id @default(cuid())
  name     String
  sessions Session[]
}

model Session {
  id       String   @id @default(cuid())
  roomCode String   @unique
  gm       User     @relation(fields: [gmId], references: [id])
  gmId     String
  tokens   Token[]
  map      Map?
}

model Map {
  id        String @id @default(cuid())
  session   Session @relation(fields: [sessionId], references: [id])
  sessionId String
  url       String
  width     Int
  height    Int
}

model Token {
  id        String   @id @default(cuid())
  session   Session  @relation(fields: [sessionId], references: [id])
  sessionId String
  name      String
  x         Float
  y         Float
  size      Float
  initiative Int?
}
```

This structure keeps all persistent state around a `Session` (a single game room). Tokens store position and initiative order.

## Development Steps

1. **Scaffold** the project with `npm create vite@latest` for the client and a simple Express server for the backend.
2. **Implement WebSocket API** using `socket.io`.
3. **Create React components** for map view, token icons, and initiative list.
4. **Add Prisma models** and migrations once the schema is stable.
5. **Deploy** using Docker—client and server can run in separate containers.

## Roadmap

1. **MVP Completion** – Map upload, token movement, initiative tracking with real‑time sync.
2. **Quality of Life** – Basic drawing tools, simple dice roller.
3. **Advanced** – Video/audio chat, fog of war, or integration with online compendiums.

Start small and iterate. The goal is a functional, easy‑to-maintain VTT that supports a single GM with up to four players.


## Local Development

1. **Install Dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. **Run the Server**
   ```bash
   cd server
   npm start
   ```
3. **Run the Client**
   ```bash
   cd client
   npm run dev
   ```
The client will proxy API requests to `localhost:3001` and open the app at `localhost:5173` by default.

Once both server and client are running, open the client in your browser. Use the file picker to upload a map image, then add tokens with the **Add Token** button. Drag tokens around and adjust their initiative values in the list. All actions sync instantly across connected clients.
