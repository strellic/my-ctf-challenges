const METERS_THRESHOLD = 45
const SPEED_THRESHOLD = 8

const { haversine } = require('./haversine')

const initializeState = (waypoints, timestamp) => {
    const result = waypoints.map((position) => ({
        p: position,
        v: false, // when visited it will be a timestamp
        s: false,
    }))
    result[0].v = timestamp
    return result
}

const isCompletedState = (state) => {
    return state.every(({ v }) => v)
}

const updateState = (team, id, state, position, timestamp) => {
    const copy = structuredClone(state)

    let lastVisited
    let firstUnvisited
    for (const step of copy) {
        if (lastVisited !== undefined && firstUnvisited === undefined && step.v === false) {
            firstUnvisited = step
        } else if (step.v !== false) {
            lastVisited = step
        }
    }
    if (lastVisited === undefined) return [copy, false]
    if (firstUnvisited === undefined) return [copy, false]

    const [pLat, pLon] = lastVisited.p
    const [nLat, nLon] = firstUnvisited.p
    const [cLat, cLon] = position
    const meters = haversine(pLat, pLon, nLat, nLon)
    const deltaTime = timestamp - lastVisited.v

    if (
        meters / deltaTime <= SPEED_THRESHOLD
        && haversine(nLat, nLon, cLat, cLon) < METERS_THRESHOLD
    ) {
        firstUnvisited.v = timestamp
    }

    let isCheating = state.filter(({ v }) => v).length > 2 && meters / deltaTime > SPEED_THRESHOLD && haversine(nLat, nLon, cLat, cLon) < METERS_THRESHOLD && meters > 60 && !lastVisited.s;
    if (isCheating) {
        const failureReason = `
anticheat: waypoints done ${state.filter(({ v }) => v).length} > 2
speed ${meters / deltaTime}m/s > threshold ${SPEED_THRESHOLD}m/s
waypoint dist ${haversine(nLat, nLon, cLat, cLon)}m < threshold ${METERS_THRESHOLD}
dist from last waypoint ${meters} > 60
last skipped: ${lastVisited.s}
        `.trim().replaceAll("\n", ", ");
        reportFailure(team, id, failureReason, false);
    }

    return [copy, isCheating]
}

const skipWaypoint = (state, timestamp) => {
    const copy = structuredClone(state)

    let lastVisited
    let firstUnvisited
    for (const step of copy) {
        if (lastVisited !== undefined && firstUnvisited === undefined && step.v === false) {
            firstUnvisited = step
        } else if (step.v !== false) {
            lastVisited = step
        }
    }
    if (lastVisited === undefined) return copy
    if (firstUnvisited === undefined) return copy

    firstUnvisited.v = timestamp
    firstUnvisited.s = true
    return copy;
};

const messages = [
    "would rather cheat than touch grass 🌱 😱",
    "hasn't left their basement in months to touch grass 🥵 🤭 🤣",
    "needs to stop staring at their screen and go outside to TOUCH GRASS 🥴 😵‍💫 🌿",
    "- have you ever considered going outside more often? 🤔 🌳",
    "a simple way to solve this challenge is to just go outside and touch some grass 🥱 🍃",
    "mastered the art of grass-touching from the couch! 💻🙌 But nothing beats the real experience, so step outside and enjoy the great outdoors! 🌳😄",
    "- go outside, talk to some real people, and embrace nature's beauty! 🏞️",
    "set a world record for avoiding grass! 🏆 Meanwhile, the rest of us are out there embracing nature! 🍃😎",
    "tried to cheat the grass police? 🚔🚨 Good luck outrunning nature! 🤡 ",
    "- hacking grass-touching challenges won't get you far, my friend! Get outside and embrace the green goodness! 🌿😉",
    "- when life gives you grass-touching challenges, make it a walk in the park by actually touching the grass! 🚶‍♀️🌳",
    "- how about leveling up from virtual hacking to real-life grass-touching? Trust us, the graphics are way better out here! 🌳😉",
    "- here's a secret cheat code to beat touching grass! It's called 'StepOutside.exe.' Try it, it's revolutionary! 😂🌱",
    "cannot handle a little outdoor adventure with some good ol' grass-touching action! 🌱🎉",
    "watched three hours of skibidi toilet instead of touching grass 🤣🤣🤣"
];

const reportFailure = (team, id, failureReason, shamePublicly = false) => {
    if (process.env.PRIV_WEBHOOK_URL) {
        fetch(process.env.PRIV_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "gdb",
                content: `Team ${team} (${id}) triggered: ${failureReason}`,
                allowed_mentions: { parse: [] } 
            })
        });
    }
    if (process.env.WEBHOOK_URL && shamePublicly) {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        fetch(process.env.WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "shawtybuzz101",
                content: `Team ${team} ${msg}`,
                allowed_mentions: { parse: [] } 
            })
        });
    }
}

module.exports = { initializeState, isCompletedState, updateState, skipWaypoint, reportFailure }