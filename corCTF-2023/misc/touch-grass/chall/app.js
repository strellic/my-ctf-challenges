const vision = require("@google-cloud/vision");
const exifparser = require("exif-parser");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");

const app = express();

const PORT = process.env.PORT || 8080;
const FLAG = process.env.FLAG || "corctf{test_flag}";

const PRIV_WEBHOOK = process.env.PRIV_WEBHOOK;
const PUB_WEBHOOK = process.env.PUB_WEBHOOK;
const SITE_KEY = process.env.SITE_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

const client = new vision.ImageAnnotatorClient({
    keyFilename: "./gcp-sa.json"
});

const session = require("express-session");
const MemoryStore = require("memorystore")(session)

app.use(
    session({
        cookie: { maxAge: 3600000 },
        store: new MemoryStore({
            checkPeriod: 3600000, // prune expired entries every 1h
        }),
        resave: false,
        saveUninitialized: false,
        secret: require("crypto").randomBytes(32).toString("hex"),
    })
);

app.set("view engine", "hbs");
app.use(express.urlencoded({ extended: false }));

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("not an image"));
        }
    },
});

app.use((req, res, next) => {
    if (!req.session.code) {
        req.session.code = Math.random().toString().slice(2, 10);
    }
    if (!req.session.state) {
        req.session.state = Math.random().toString(36).slice(2);
    }

    // debug code is for testing purposes
    if (req.query.SECRET_DEBUG_CODE_LOL) {
        req.session.code = req.query.SECRET_DEBUG_CODE_LOL;
    }

    res.locals.SITE_KEY = SITE_KEY;

    res.locals.touched = req.session.touched;
    res.locals.state = req.session.state;
    res.locals.code = req.session.code;
    res.locals.team = req.session.team;
    res.locals.flag = FLAG;

    res.locals.error = req.session.error;
    req.session.error = null;
    next();
})

// thank you, ChatGPT :)
function containsSubstringWithAtMostOneError(sentence, substring) {
    for (let i = 0; i <= sentence.length - substring.length; i++) {
        let errorCount = 0;
        for (let j = 0; j < substring.length && errorCount <= 1; j++) {
            if (sentence[i + j] !== substring[j]) {
                errorCount++;
            }
        }
        if (errorCount <= 1) {
            return true;
        }
    }
    return false;
}

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
];

function reportFailure(team, type, cheater=false) {
    if (!PRIV_WEBHOOK) {
        console.log("failure:", team, type, cheater);
        return;
    }
    fetch(PRIV_WEBHOOK, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: "touch-grass",
            content: `[${(new Date()).toISOString()}] team ${team} failed touch-grass for: ${type}`,
            allowed_mentions: { parse: [] }
        })
    });
    if (cheater) {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        fetch(PUB_WEBHOOK, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "codegate-anticheat.sys",
                content: `Team ${team} ${msg}`,
                allowed_mentions: { parse: [] }
            })
        });
    } 
}
function getPixel(metadata, raw, x, y) {
    const offset = metadata.channels * (metadata.width * y + x);
    return `#` + Array(metadata.channels).fill().map((_, i) => raw[offset + i].toString(16).padStart(2, '0')).join("");
}

const requiresLogin = (req, res, next) => req.session.team ? next() : res.redirect("/");

app.post("/api/submit", [requiresLogin, upload.single("image")], async (req, res) => {
    if (!req.body["g-recaptcha-response"]) {
        req.session.error = "missing captcha";
        return res.redirect("/");
    }

    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `secret=${encodeURIComponent(SECRET_KEY)}&response=${encodeURIComponent(req.body["g-recaptcha-response"])}`
    });
    const recaptcha = await r.json();

    if (!recaptcha.success) {
        req.session.error = "invalid captcha";
        return res.redirect("/");
    }

    let img, metadata, raw;
    try {
        img = await sharp(req.file.buffer);
        metadata = await img.metadata();
        raw = await img
            .raw()
            .toBuffer();
    }
    catch {
        req.session.error = "unable to read image";
        return res.redirect("/");
    }

    const image = req.file.buffer.toString("base64");

    const blacklist = ["imagedescription", "copyright", "paint"];

    // this only works for JPEGs / TIFFs
    // if png or something else this check crashes
    try {
        const parser = exifparser.create(req.file.buffer);
        const exif = JSON.stringify(parser.parse());

        if (blacklist.some(w => exif.toLowerCase().includes(w))) {
            req.session.error = "nice try, cheater";
            reportFailure(req.session.team, `exif anticheat: contained keywords ${blacklist.filter(b => exif.includes(b)).join(", ")}`, true);
            return res.redirect("/");
        }

        if (exif.includes("GIMP")) {
            req.session.error = "nice try, cheater";
            reportFailure(req.session.team, `exif GIMP anticheat: contained keyword GIMP`, true);
            return res.redirect("/");
        }
    }
    catch {}

    // for some reason iPhone images all contain "Photoshop 3.0" in them??
    const imageStr = req.file.buffer.toString();
    if (blacklist.some(w => imageStr.toLowerCase().replace(/photoshop 3.0/g, "").includes(w))) {
        req.session.error = "nice try, cheater";
        reportFailure(req.session.team, `text anticheat: contained keywords ${blacklist.filter(b => imageStr.includes(b)).join(", ")}`, true);
        return res.redirect("/");
    }

    if (imageStr.includes("GIMP")) {
        req.session.error = "nice try, cheater";
        reportFailure(req.session.team, `text anticheat: contained keyword GIMP`, true);
        return res.redirect("/");
    }

    const metadataStr = JSON.stringify(metadata);
    if (blacklist.some(w => metadataStr.toLowerCase().replace(/photoshop 3.0/g, "").includes(w))) {
        req.session.error = "nice try, cheater";
        reportFailure(req.session.team, `sharp metadata anticheat: contained keywords ${blacklist.filter(b => imageStr.includes(b)).join(", ")}`, true);
        return res.redirect("/");
    }

    if (metadataStr.includes("GIMP")) {
        req.session.error = "nice try, cheater";
        reportFailure(req.session.team, `sharp metadata anticheat: contained keyword GIMP`, true);
        return res.redirect("/");
    }

    const webDetection = await client.webDetection({
        image: {
            content: image
        }
    });

    const web = webDetection[0].webDetection;
    if (web.pagesWithMatchingImages.length + web.partialMatchingImages.length + web.fullMatchingImages.length >= 4) {
        req.session.error = "nice try, cheater";
        reportFailure(req.session.team, `web anticheat: pages with matching images ${web.pagesWithMatchingImages.length}, partial matching images ${web.partialMatchingImages.length}, full matching images ${web.fullMatchingImages.length}`, true);
        return res.redirect("/");
    }

    const labelDetection = await client.labelDetection({
        image: {
            content: image
        }
    });

    const labels = labelDetection[0].labelAnnotations;
    if (!labels.find(l => l.description === "Grass" && l.score >= 0.7 )) {
        req.session.error = "we could not find the grass in your image :(";
        reportFailure(req.session.team, "missing grass");
        return res.redirect("/");
    }
    if (!labels.find(l => ["Finger", "Gesture", "Hand", "Nail", "Thumb", "Wrist"].includes(l.description) && l.score >= 0.7 )) {
        req.session.error = "where was your hand?";
        reportFailure(req.session.team, "missing hand");
        return res.redirect("/");
    }

    const textDetection = await client.textDetection({
        image: {
            content: image
        }
    });

    const texts = textDetection[0].textAnnotations.map(t => (t.description || "").replace(/\s/g, ""));
    const ocrBlacklist = ["stock", "getty", "touch", "grass", "adobe", "alamy", "splash", "pixabay"];
    if (ocrBlacklist.some(w => texts.join(" ").toLowerCase().includes(w))) {
        req.session.error = "nice try, cheater";
        reportFailure(req.session.team, `ocr text anticheat: contained keywords ${ocrBlacklist.filter(b => texts.join(" ").toLowerCase().includes(w)).join(", ")}`, true);
        return res.redirect("/");
    }

    if (!texts.find(t => containsSubstringWithAtMostOneError(t, req.session.code))) {
        req.session.error = `we could not find the code in your image! found text: ${texts.join(", ")}`;
        reportFailure(req.session.team, `missing code, found text: ${texts.join(", ")}`);
        return res.redirect("/");
    }

    // a very sus check
    // finds the color of the center of letters (ugh)
    const seen = {};
    try {
        for (const page of textDetection[0].fullTextAnnotation.pages) {
            for (const block of page.blocks) {
                if (block.blockType !== "TEXT") continue;
                for (const paragraph of block.paragraphs) {
                    for (const word of paragraph.words) {
                        const text = word.symbols.map(s => s.text).join("");
                        if (!containsSubstringWithAtMostOneError(text, req.session.code)) continue;
                        const locs = word.symbols.map(s => Object.values(s.boundingBox.vertices).map(v => Object.values(v)).reduce(([ax, ay], [bx, by]) => [ax + bx, ay + by], [0, 0]).map(s => Math.floor(s / 4)));
                        for (const loc of locs) {
                            const pixel = getPixel(metadata, raw, loc[0], loc[1]);
                            if (!seen[pixel]) seen[pixel] = 0;
                            seen[pixel]++;
                        }
                    }
                }
            }
        }
    }
    catch {}

    if (Object.values(seen).some(v => v >= 4)) {
        req.session.error = "nice try, cheater";
        reportFailure(req.session.team, `text color anticheat: colors: ${JSON.stringify(seen)}`, true);
        return res.redirect("/");
    }

    req.session.touched = true;
    res.redirect("/");
});

app.get("/auth", async (req, res) => {
    if (!req.query.state || typeof req.query.state !== "string" || req.query.state !== req.session.state) {
        req.session.error = "missing oauth state";
        return res.redirect("/");
    }
    if (!req.query.token || typeof req.query.token !== "string") {
        req.session.error = "missing oauth token";
        return res.redirect("/");
    }

    const r = await fetch("https://2023.cor.team/api/v1/users/me", {
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

app.use((err, req, res, next) => {
    console.log(err);
    req.session.error = `Error: ${err.message}`;
    res.redirect("/");
})

app.listen(PORT, () => console.log(`misc/touch-grass listening on port ${PORT}`));
