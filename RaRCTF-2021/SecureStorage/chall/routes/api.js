const express = require("express");
const bcrypt = require("bcrypt");
const fetch = require("node-fetch");

const router = express.Router();

let users = [];

router.post("/register", async (req, res) => {
    let { user, pass } = req.body;

    if(!user || !pass) {
        req.session.error = "Missing username or password";
        return res.redirect("/register");
    }

    if(users.find(u => u.user === user)) {
        req.session.error = "A user already exists with that username";
        return res.redirect("/register");
    }

    pass = await bcrypt.hash(pass, 12);
    users.push({user, pass});

    req.session.user = user;
    req.session.info = `Logged in as ${user} successfully`;
    return res.redirect("/home");
});

router.post("/login", async (req, res) => {
    let { user, pass } = req.body;

    if(!user || !pass) {
        req.session.error = "Missing username or password";
        return res.redirect("/login");
    }

    if(!users.find(u => u.user === user)) {
        req.session.error = "No user exists with that username";
        return res.redirect("/login");
    }

    let entry = users.find(u => u.user === user);
    if(!await bcrypt.compare(pass, entry.pass)) {
        req.session.error = "Incorrect password";
        return res.redirect("/login");
    }

    req.session.user = user;
    req.session.info = `Logged in as ${user} successfully`;
    return res.redirect("/home");
});

router.post("/submit", (req, res) => {
    let { url } = req.body;
    if(req.session.lastSubmit && new Date() - new Date(req.session.lastSubmit) <= 30*1000) {
        req.session.error = `You must wait 30 seconds between submissions`;
        return res.redirect("/submit");
    }

    if(!url || typeof url !== 'string') {
        req.session.error = "Missing URL";
        return res.redirect("/submit");
    }

    try {
        let check = new URL(url);
        if(check.protocol !== "http:" && check.protocol !== "https:") {
            req.session.error = "Invalid URL";
            return res.redirect("/submit");
        }
    }
    catch(err) {
        req.session.error = `Invalid URL`;
        return res.redirect("/submit");
    }


    let adminBot = ["admin1", "admin2", "admin3", "admin4"][Math.floor(Math.random() * 4)];
    let pos = fetch(`http://${adminBot}/xss/add`, {
        method: "POST",
        headers: {
            "Authorization": process.env.XSSBOT_SECRET,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"url": url})
    }).then((resp) => resp.json()).then((data) => {
        req.session.lastSubmit = new Date();
        req.session.info = "URL submitted to the admin succesfully, queue position: " + data.position;
        return res.redirect("/submit");
    })
    .catch(err => {
        console.log(err);
        req.session.error = "There was an error reporting your post";
        return res.redirect("/submit");
    });
});

router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

module.exports = router;
