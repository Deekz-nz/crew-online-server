import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { matchMaker } from "colyseus";

/**
 * Import your Room files
 */
import { CrewRoom } from "./rooms/CrewRoom";
import { getHighScores, addRandomHighScore } from "./db/highscores";

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

        // Return saved high scores ordered by difficulty
        app.get("/highscores", async (_req, res) => {
            try {
                const scores = await getHighScores();
                res.json(scores);
            } catch (err) {
                console.error("failed to get highscores", err);
                res.status(500).json({ error: "failed_to_fetch_highscores" });
            }
        });

        // Convenience endpoint to create a random high score for testing
        app.post("/highscores/random", async (_req, res) => {
            try {
                const score = await addRandomHighScore();
                res.json(score);
            } catch (err) {
                console.error("failed to create random highscore", err);
                res.status(500).json({ error: "failed_to_create_highscore" });
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
