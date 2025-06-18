const express = require("express");
const app = express();

const songs = require("./songs.json");

const PORT = process.env.PORT ?? 1727;

app.use(express.static("public"));
const expressWs = require('express-ws')(app);

const sessions = new Map();

const getUser = (username) => {
    if (username === "cookiezi") {
        return { send: () => {} }
    }
    return Array.from(expressWs.getWss().clients).find(c => c.username === username);
};

const calculate = (start, end, clicks) => {
    const clickArr = [...clicks];
    const bpm = Math.round(((clickArr.length / (end - start) * 60000)/4) * 100) / 100;
    const deltas = [];
    for (let i = 0; i < clickArr.length - 1; i++) {
        deltas.push(clickArr[i + 1] - clickArr[i]);
    }
    const deltaAvg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const variance = deltas.map(v => (v - deltaAvg) * (v - deltaAvg)).reduce((a, b) => a + b, 0);
    const stdev = Math.sqrt(variance / deltas.length);

    return { bpm: bpm || 0, ur: stdev * 10 || 0};
}

app.ws('/', function(ws, req) {
    ws.on('message', (msg) => {
        try {
            const { type, data } = JSON.parse(msg);
            if (type === "login") {
                if (!data || typeof data !== "string") {
                    throw new Error("Missing username");
                }
                if (data === "cookiezi") {
                    throw new Error("no");
                }
                if (data.length < 5) {
                    throw new Error("Username is too short");
                }
                if (getUser(data)) {
                    throw new Error("A user already exists with that username");
                }

                ws.username = data;
                ws.send(JSON.stringify({ type: "login" }));
                return;
            }

            if (!ws.username) {
                throw new Error("Please set a username first!");
            }

            if (type === "host" || type === "challenge") {
                const gameId = Math.random().toString(36).slice(2,7);
                ws.gameId = gameId;
                const session = {
                    users: [ ws.username ],
                    host: ws.username,
                    gameId,
                    started: false,
                    results: [],
                    round: 0,
                    isChallenge: false,
                    start: +new Date()
                };
                sessions.set(gameId, session);

                if (type === "challenge") {
                    session.isChallenge = true;
                    session.users.push("cookiezi");
                }

                ws.send(JSON.stringify({ type: "join", data: session }));
                return;
            }

            if (type === "join") {
                const gameId = data;
                if (!sessions.has(gameId)) {
                    throw new Error("Invalid game ID");
                }

                const session = sessions.get(gameId);

                if (session.started) {
                    throw new Error("This lobby already started!");
                }

                session.users.push(ws.username);
                ws.gameId = gameId;
                
                for (const user of session.users) {
                    getUser(user)?.send(JSON.stringify({ type: "join", data: session }));
                }
                return;
            }

            if (!ws.gameId) {
                throw new Error("Missing game id!");
            }

            const session = sessions.get(ws.gameId);
            if (!session) {
                throw new Error("Invalid game ID");
            }

            if (type === "start") {
                if (session.host !== ws.username) {
                    throw new Error("You are not the host!");
                }
                session.started = true;
                const songList = [...songs].sort(() => 0.5 - Math.random()).slice(0, 3);
                for (const song of songList) {
                    song.duration = Math.min(Math.min(Math.round(Math.random() * (song.length - 8)) + 8, 30), song.length - 2);
                    song.startOffset = Math.random() * (song.length - song.duration);
                }
                session.songs = songList;
                
                for (const user of session.users) {
                    getUser(user)?.send(JSON.stringify({ type: "game", data: session }));
                }
                return;
            }

            if (type === "results") {
                if (!session.started) {
                    throw new Error("The session did not start!");
                }

                if (typeof data.start !== "number" || typeof data.end !== "number" || !Array.isArray(data.clicks)) {
                    throw new Error("Missing data");
                }

                const duration = data.end - data.start;
                if (Math.abs(session.songs[session.round].duration * 1000 - duration) > 1500) {
                    ws.send(JSON.stringify({ type: "error", data: "The start and end times are incorrect!" }));
                    data.clicks = new Set();
                }

                if (!session.results[session.round]) {
                    session.results[session.round] = [];
                }

                session.results[session.round][session.users.indexOf(ws.username)] = {
                    ...data.clicks.length < 2 ? ({ bpm: 0, ur: 0 }) : calculate(data.start, data.end, new Set(data.clicks)),
                    username: ws.username
                }
                if (session.results[session.round].filter(Boolean).length === session.users.filter(u => u !== "cookiezi").length) {
                    if (session.isChallenge) {
                        session.results[session.round][session.users.indexOf("cookiezi")] = {
                            bpm: session.songs[session.round].bpm,
                            ur: session.songs[session.round].bpm === 222.22 ? 0 : 20,
                            username: "cookiezi"
                        };
                    }

                    session.results[session.round] = session.results[session.round].sort((a, b) => {
                        const bpmDeltaA = Math.abs(Math.round(a.bpm) - session.songs[session.round].bpm);
                        const bpmDeltaB = Math.abs(Math.round(b.bpm) - session.songs[session.round].bpm);
                        if (bpmDeltaA !== bpmDeltaB) return bpmDeltaA - bpmDeltaB;
                        return a.ur - b.ur
                    });

                    for (const user of session.users) {
                        getUser(user)?.send(JSON.stringify({ type: "results", data: session }));
                    }

                    if (session.round < session.songs.length - 1) {
                        setTimeout(() => {
                            session.round++;
                            for (const user of session.users) {
                                getUser(user)?.send(JSON.stringify({ type: "game", data: session }));
                            }
                        }, 6000);
                    }
                    else {
                        const winCounts = (new Array(session.users.length)).fill(0);
                        for (const result of session.results) {
                            winCounts[session.users.indexOf(result[0].username)]++; 
                        }
                        const winner = session.users[winCounts.indexOf(Math.max(...winCounts))];

                        for (const user of session.users) {
                            if (user === winner) {
                                if (session.isChallenge) {
                                    getUser(user)?.send(JSON.stringify({ type: "message", data: "Nice job! " + (process.env.FLAG || "osu{test_flag}") }));
                                }
                                else {
                                    getUser(user)?.send(JSON.stringify({ type: "message", data: "Nice job!" }));
                                }
                            }
                            else {
                                getUser(user)?.send(JSON.stringify({ type: "message", data: "Better luck next time!" }));
                            }
                        }

                        sessions.delete(session.gameId);
                    }
                }
                return;
            }

            throw new Error("Invalid type!");
        } catch (e) {
            ws.send(JSON.stringify({ type: "error", data: e.message }));
        }
    });
});

setInterval(() => {
    for (const [k, v] of sessions.entries()) {
        if (+new Date() - v.start > 300000) { // 5 minutes in ms
            sessions.delete(k);
        }
    }
}, 60_000);

app.listen(PORT, () => console.log(`web/stream-vs running at http://localhost:${PORT}`));