# Welcome to Colyseus!

This project has been created using [⚔️ `create-colyseus-app`](https://github.com/colyseus/create-colyseus-app/) - an npm init template for kick starting a Colyseus project in TypeScript.

[Documentation](http://docs.colyseus.io/)

## :crossed_swords: Usage

```
npm start
```

## Structure

- `index.ts`: main entry point, register an empty room handler and attach [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor)
- `src/rooms/MyRoom.ts`: an empty room handler for you to implement your logic
- `src/rooms/schema/MyRoomState.ts`: an empty schema used on your room's state.
- `loadtest/example.ts`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
    - `scripts`:
        - `npm start`: runs `ts-node-dev index.ts`
        - `npm test`: runs mocha test suite
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.
- `tsconfig.json`: TypeScript configuration file

## HTTP API

### `GET /available_rooms`

Returns a list of active `crew` rooms that are open for players to join. Each
entry includes the room identifier and current occupancy information.

Example response:

```json
[
  {
    "roomId": "abcd",
    "clients": 2,
    "maxClients": 5,
    "metadata": {}
  }
]
```

The `roomId` from the response can be passed to the Colyseus client when joining
a room:

```ts
client.joinById(roomId, { displayName: "My Name" });
```

## The Database

Run the below to start the database

```bash
docker-compose up -d
```

Include the below in your .env file for local development

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crew
```

You can manually seed the database (after making changes to schema.ts) using:

```bash
npx drizzle-kit push
```

Or to make the changes as part of the migration files, use:

```bash
npx drizzle-kit generate # create migration files
npx drizzle-kit migrate # apply migrations
```

## License

MIT
