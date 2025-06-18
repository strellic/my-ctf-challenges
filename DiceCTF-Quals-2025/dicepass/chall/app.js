const express = require("express");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

const bot = require("./bot.js");
const app = express();

const reportHtml = fs.readFileSync("./report.html", "utf8");

app.use(express.static("./docs/build/"));
app.use(express.urlencoded({ extended: false }));

app.post("/report", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
        return res.redirect("/report?error=missing url");
    }

    try {
        const urlObj = new URL(url);
        if (!["http:", "https:"].includes(urlObj.protocol)) {
            return res.redirect("/report?error=invalid url");
        }
    }
    catch {
        return res.redirect("/report?error=invalid url");
    }

    if (process.env.RECAPTCHA_SECRET && process.env.RECAPTCHA_SITE) {
        if (!req.body["g-recaptcha-response"]) {
            return res.redirect("/report?error=missing captcha");
        }

        const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(req.body["g-recaptcha-response"])}`
        });

        const recaptcha = await r.json();
        if (!recaptcha.success) {
            return res.redirect("/report?error=invalid captcha");
        }
    }

    bot.visit(url);
    res.send("Reported!");
});

app.get("/report", (req, res) => {
    res.send(reportHtml.replace("$SITE_KEY", process.env.RECAPTCHA_SITE ?? ""));
});

app.listen(PORT, () => console.log("web/dicepass listening on port " + PORT));