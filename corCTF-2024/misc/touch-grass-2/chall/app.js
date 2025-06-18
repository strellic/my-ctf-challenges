const express = require("express");
const crypto = require("crypto");

const app = express();
const { haversine } = require('./haversine')
const { initializeState, isCompletedState, updateState, skipWaypoint, reportFailure } = require('./state')

const PORT = process.env.PORT || 8080;
const SECRET = process.env.SECRET_KEY || crypto.randomBytes(64).toString('hex');
const FLAG = process.env.FLAG || "corctf{test_flag}";

app.set("view engine", "hbs");
app.use(express.urlencoded({ extended: false }));
app.use(require('cookie-session')({
    name: 'session',
    secret: SECRET,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

const MAX_ERM_COUNT = 3;
const MAX_SKIP_COUNT = 3;
const erm = new Map();
const valFailed = new Map();

const query = (lat, lon, min) => `
<osm-script output="json" output-config="" timeout="25">
    <union into="inner">
    <query into="_" type="way">
        <has-kv k="leisure" modv="" v="park"/>
        <has-kv k="access" modv="not" v="private"/>
        <around radius="${min}" lat="${lat}" lon="${lon}"/>
    </query>
    <query into="_" type="relation">
        <has-kv k="leisure" modv="" v="park"/>
        <has-kv k="access" modv="not" v="private"/>
        <around radius="${min}" lat="${lat}" lon="${lon}"/>
    </query>
    </union>
    <union into="outer">
    <query into="_" type="way">
        <has-kv k="leisure" modv="" v="park"/>
        <has-kv k="access" modv="not" v="private"/>
        <around radius="8000" lat="${lat}" lon="${lon}"/>
    </query>
    <query into="_" type="relation">
        <has-kv k="leisure" modv="" v="park"/>
        <has-kv k="access" modv="not" v="private"/>
        <around radius="8000" lat="${lat}" lon="${lon}"/>
    </query>
    </union>
    <difference into="_">
        <item from="outer" into="_"/>
        <item from="inner" into="_"/>
    </difference>
    <print
        e=""
        from="_"
        geometry="center"
        ids="yes"
        limit=""
        mode="body"
        n=""
        order="id"
        s=""
        w=""
    />
</osm-script>
`;

const findParks = async (lat, lon, minDist) => {
    const response = await fetch(
        'https://overpass-api.de/api/interpreter',
        {
            method: 'POST',
            body: `data=${encodeURIComponent(query(lat, lon, minDist))}`,
        }
    )
    const data = await response.json()
    return data.elements
};

const getWaypoints = async (lat, lon, lat2, lon2) => {
    const response = await fetch(`https://router.project-osrm.org/route/v1/walking/${lon},${lat};${lon2},${lat2}?geometries=geojson`);
    const data = await response.json();
    if (data.code !== "Ok") return [];
    return data.routes[0].geometry.coordinates.map(([a,b]) => [b,a]);
};

// session formats
// session.data = { state: 'selecting', parks: string[], waypoints: [lat, lon][] }
// session.data = { state: 'walking', park: string, data: ({ position: [lat, lon], visited: false | time })[] }

// lmaooooooo
const CHECK_PAYLOAD = `
(async () => {
    try {
        if (window.ran) return;
        window.ran = true;
        $("#flag").style.display = "none";
        const pos1 = await new Promise(r => navigator.geolocation.getCurrentPosition(position => r(position.coords), _=>r({ latitude:0,longitude:0,accuracy:0 }), { enableHighAccuracy: true, timeout: 1000 }));
        const f = document.createElement("iframe");
        f.style.display = 'none';
        document.body.appendChild(f);
        const pos2 = await new Promise(r => f.contentWindow.navigator.geolocation.getCurrentPosition(position => r(position.coords), _=>r({ latitude:0,longitude:0,accuracy:0 }), { enableHighAccuracy: true, timeout: 1000 }))
        const r = await fetch("/api/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "pos1="+pos1.latitude+","+pos1.longitude+","+pos1.accuracy+"&pos2="+pos2.latitude+","+pos2.longitude+","+pos2.accuracy
        });
        const data = await r.json();
        alert(data.message);
        $("#flag").innerText = data.message;
        $("#flag").style.display = "block";
    } catch (err) {
        const r = await fetch("/api/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "error=" + encodeURIComponent(err.message)
        });
        const data = await r.json();
        alert(data.message);
        $("#flag").innerText = data.message;
        $("#flag").style.display = "block";
    }
})();
`;

const CHECK_HTML = `
<svg style="display:none"><svg style="display:none" onload="eval(atob('${btoa(CHECK_PAYLOAD)}'))" />
`;

app.use((req, res, next) => {
    if (!req.session.state) {
        req.session.state = Math.random().toString(36).slice(2, 7);
    }

    res.locals.team = req.session.team;
    res.locals.state = req.session.state;
    res.locals.host = req.get('host');
    res.locals.walking = req.session.data && req.session.data.state === 'walking';
    res.locals.skip = req.session.skip || 0;
    res.locals.maxSkip = MAX_SKIP_COUNT;

    if (req.query.TESTING_LOL) {
        req.session.testing = true;
    }

    next();
});

app.get("/api/reset", (req, res) => {
    req.session = null;
    res.send('ok');
});

app.post("/api/locate", async (req, res) => {
    let { lat, lon } = req.body;

    if (!lat || !lon) {
        return res.json({ error: "missing latitude or longitude" });
    }

    lat = parseFloat(lat)
    lon = parseFloat(lon)

    if (isNaN(lat) || isNaN(lon)) {
        return res.json({ error: "latitude or longitude is not a float" });
    }

    const parks = await findParks(lat, lon, req.session.testing ? 50 : 400);

    if (parks.length === 0) {
        return res.json({ error: "hmm, no good destinations found near you. sorry! maybe you should try hacking this app..." });
    }

    const data = parks.map((park) => ({
        center: park.center,
        name: park?.tags?.name ?? 'Unnamed',
    }))
    const withDistances = data.map((park) => [
        haversine(
            lat, lon, park.center.lat, park.center.lon
        ),
        park
    ])
    withDistances.sort(([dist1], [dist2]) => dist1 - dist2)
    const sorted = withDistances.map(([, park]) => park).slice(0, 5)

    const waypoints = await Promise.all(sorted.map(async park => [
        [lat, lon],
        ...(await getWaypoints(lat, lon, park.center.lat, park.center.lon)),
        [park.center.lat, park.center.lon],
    ]));
    
    const waypointJson = JSON.stringify(waypoints)
    const hash = sha256(waypointJson)

    req.session.data = { state: 'selecting', parks: sorted, hash }

    return res.json({ success: true, parks: sorted, waypointJson });
});

app.post("/api/start", async (req, res) => {
    const { route, waypointJson } = req.body;

    if (!route || isNaN(parseInt(route))) {
        return res.json({ error: "missing or invalid route index" });
    }

    if (!req.session.data) {
        return res.json({ error: "need to find paths first" });
    }

    if (req.session.data.state !== 'selecting') {
        return res.json({ error: "already started" });
    }

    if (sha256(waypointJson) !== req.session.data.hash) {
        return res.json({ error: 'waypoints do not match' })
    }

    const i = parseInt(route);

    const park = req.session.data.parks[i];
    const waypoints = JSON.parse(waypointJson)[i];

    req.session.data = { state: 'walking', park, data: initializeState(waypoints, (Date.now() / 1000) | 0), id: Math.random().toString(36).slice(2,9) };
    req.session.skip = 0;
    return res.json({ success: true });
});

app.post("/api/update", async (req, res) => {
    if (!req.session.data || req.session.data.state !== 'walking') {
        return res.json({ error: "walk has not started" });
    }

    let { lat, lon } = req.body;

    if (!lat || !lon) {
        return res.json({ error: "missing latitude or longitude" });
    }

    lat = parseFloat(lat)
    lon = parseFloat(lon)

    if (isNaN(lat) || isNaN(lon)) {
        return res.json({ error: "latitude or longitude is not a float" });
    }

    if (valFailed.get(req.session.data.id)) {
        // dont alert since we already alerted in validate
        req.session = null;
        return res.json({ error: "nice try, cheater" });
    }

    if (erm.get(req.session.data.id) >= MAX_ERM_COUNT) {
        reportFailure(req.session.team, req.session.data.id, "reaching max erm count", true);
        erm.delete(req.session.data.id);
        req.session = null;
        return res.json({ error: "nice try, cheater" });
    }

    const [newData, isCheating] = updateState(req.session.team, req.session.data.id, req.session.data.data, [lat, lon], (Date.now() / 1000) | 0);

    req.session.data = {
        state: 'walking',
        park: req.session.data.park,
        data: newData,
        id: req.session.data.id
    }

    if (isCheating) {
        erm.set(req.session.data.id, (erm.get(req.session.data.id) || 0) + 1);
    }

    const flag = isCompletedState(newData) ? "congrats! you touched grass! here's your flag: " + FLAG : null;
    if (flag) {
        if (!req.session.t) req.session.t = +new Date();
    }

    return res.json({
        success: true,
        park: req.session.data.park,
        data: req.session.data.data,
        flag,
    });
});

app.post("/api/validate", (req, res) => {
    if (req.session.gg) {
        return res.json({ message: "congrats! you touched grass! here's your flag: " + FLAG });
    }

    if (!req.session.data || req.session.data.state !== 'walking') {
        return res.json({ message: "walk has not started" });
    }

    if (!isCompletedState(req.session.data.data)) {
        return res.json({ message: "please be serious" });
    }

    const { error } = req.body;
    if (error) {
        reportFailure(req.session.team, req.session.data.id, "error in checker" + error, true);
        valFailed.set(req.session.data.id, true);
        req.session = null;
        return res.json({ message: "nice try cheater" });
    }

    const { pos1, pos2 } = req.body;
    if (!pos1 || !pos2) {
        reportFailure(req.session.team, req.session.data.id, "did not send pos1 or pos2 in validation", true);
        valFailed.set(req.session.data.id, true);
        req.session = null;
        return res.json({ message: "nice try cheater" });
    }

    const [lat1, lon1, acc1] = pos1.split(',').map(parseFloat);
    const [lat2, lon2, acc2] = pos2.split(',').map(parseFloat);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) || isNaN(acc1) || isNaN(acc2)) {
        reportFailure(req.session.team, req.session.data.id, "failed isNaN validation", true);
        valFailed.set(req.session.data.id, true);
        req.session = null;
        return res.json({ message: "nice try cheater" });
    }

    const delta = (a,b) => Math.abs(a - b);
    const [a,b,c] = [delta(lat1, lat2), delta(lon1, lon2), delta(acc1, acc2)];
    if (a > 0.01 || b > 0.01 || c > 1) {
        reportFailure(req.session.team, req.session.data.id, `failed iframe coordinate delta (${Math.min(parseFloat(a.toFixed(3)), 1)}, ${Math.min(parseFloat(b.toFixed(3)), 1)}, ${c.toFixed(3)})`, true);
        valFailed.set(req.session.data.id, true);
        req.session = null;
        return res.json({ message: "nice try cheater" });
    }

    const deltaTime = +new Date() - req.session.t;
    if (deltaTime > 10_000) {
        reportFailure(req.session.team, req.session.data.id, `took too long to validate ${deltaTime}ms > 10000ms`, true);
        valFailed.set(req.session.data.id, true);
        req.session = null;
        return res.json({ message: "nice try cheater" });
    }

    req.session.gg = true;
    return res.json({ message: "congrats! you touched grass! here's your flag: " + FLAG });
});

app.post("/api/skip", (req, res) => {
    if (!req.session.data || req.session.data.state !== 'walking') {
        return res.json({ error: "walk has not started" });
    }

    const skipCount = req.session.skip || 0;

    if (skipCount >= MAX_SKIP_COUNT && !req.session.testing) {
        return res.json({ error: "you already skipped too many times" });
    }

    req.session.data = {
        state: 'walking',
        park: req.session.data.park,
        data: skipWaypoint(req.session.data.data, (Date.now() / 1000) | 0),
        id: req.session.data.id
    };

    req.session.skip = skipCount + 1;
    return res.json({
        success: true
    });
});

app.get("/auth", async (req, res) => {
    if (!req.query.state || typeof req.query.state !== "string" || req.query.state !== req.session.state) {
        return res.send("missing oauth state");
    }
    if (!req.query.token || typeof req.query.token !== "string") {
        return res.send("missing oauth token");
    }

    const r = await fetch("https://2024.cor.team/api/v1/users/me", {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${req.query.token}`
        }
    });

    const json = await r.json();

    if (json.kind !== "goodUserData") {
        req.session.error = "invalid oauth token";
        return res.redirect("/");
    }

    req.session.team = json.data.name;
    res.redirect("/");
});

app.get("/", (req, res) => res.render("index"));

app.listen(PORT, () => console.log(`misc/touch-grass-2 running on port ${PORT}`));