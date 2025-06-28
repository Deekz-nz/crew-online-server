import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { matchMaker } from "colyseus";

/**
 * Import your Room files
 */
import { CrewRoom } from "./rooms/CrewRoom";

export default config({

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('crew', CrewRoom);

    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */
        app.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        // Endpoint to list available rooms
        app.get("/available_rooms", async (_req, res) => {
            try {
                const rooms = await matchMaker.query({ name: "crew" });
                res.json(rooms);
            } catch (err) {
                console.error("failed to get available rooms", err);
                res.status(500).json({ error: "failed_to_fetch_rooms" });
            }
        });

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground());
        }

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/monitor", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
