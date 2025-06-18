const Comlink = require("comlink");
const { chromeRuntimeMessageEndpoint } = require("comlink-adapters");

console.log("[dicepass] Hello from dicepass content script!");

let remote = null, id = null;
const context = {
    version: 1.0,
    extensionId: chrome.runtime.id,
    prevPassword: null,
    prevUsername: null,
    async isLoggedIn() {
        return await remote.isLoggedIn();
    },
    async hasAutofill() {
        if (!await context.isLoggedIn()) {
            throw new Error("Not logged in to dicepass!");
        }

        return remote.hasPasswordFor(id);
    },
    async saveCredentials(username, password) {
        if (!await remote.isLoggedIn()) {
            throw new Error("Not logged in to dicepass!");
        }

        if (confirm("Do you want to save the credentials:\n\n" + username + ":" + "*".repeat(password.length) + "\n\nfor site " + location.origin + " to dicepass?")) {
            await remote.add(id, username, password);
            alert("Password saved to dicepass!");
        }
    },
    async autofill() {
        if (!await context.isLoggedIn()) {
            alert("Please log in to dicepass first!");
            return;
        }

        const usernameInput = document.querySelector('[data-dicepass-username]');
        const passwordInput = document.querySelector('[data-dicepass-password]');

        if (context.prevUsername !== null && context.prevPassword !== null) {
            usernameInput.value = context.prevUsername;
            passwordInput.value = context.prevPassword;
            context.prevPassword = null;
            context.prevUsername = null;
            return;
        }

        if (await remote.hasPasswordFor(id)) {
            const { username, password } = await remote.getLogin(id);
            context.prevUsername = usernameInput.value;
            context.prevPassword = passwordInput.value;
            usernameInput.value = username;
            passwordInput.value = password;
            return;
        }
        else if (usernameInput.value && passwordInput.value) {
            context.saveCredentials(usernameInput.value, passwordInput.value);
        }
        else {
            alert("No password saved in dicepass for " + location.origin + ".\n" + "Please enter your username and password and then click again to save.");
        }
    }
};

async function scanPage() {
    if (!await context.isLoggedIn()) {
        console.log("[dicepass] aborting scan, not logged in");
        return;
    }

    console.log("[dicepass] scanning page...");

    const passwordInput = document.querySelector('input[type="password"]');
    if (!passwordInput) {
        console.log("[dicepass] no password input found");
        return;
    }

    const textInput = document.querySelector('input[type="text"]');
    const emailInput = document.querySelector('input[type="email"]');
    if (!textInput && !emailInput) {
        console.log("[dicepass] no text or email input found");
        return;
    }

    if (document.body.hasAttribute("data-dicepass-activated")) {
        console.log("[dicepass] already activated");
        return;
    }

    console.log("[dicepass] injecting into page...");
    document.body.setAttribute("data-dicepass-activated", "true");
    passwordInput.setAttribute("data-dicepass-password", "true");
    textInput && textInput.setAttribute("data-dicepass-username", "true");
    emailInput && emailInput.setAttribute("data-dicepass-username", "true");

    const img = document.createElement("img");
    img.className = "dicepass-button";
    img.src = chrome.runtime.getURL("icon-transparent.png");

    img.addEventListener("click", context.autofill);

    document.body.appendChild(img);
}

(async () => {
    id = await chrome.runtime.sendMessage('init-content');
    remote = Comlink.wrap(chromeRuntimeMessageEndpoint());
})();

if (!document.querySelector(".dicepass-frame")) {
    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    frame.name = "dicepass";
    frame.className = "dicepass-frame";
    Comlink.expose(context, Comlink.windowEndpoint(window, frame.contentWindow, window.origin));
}

if (!document.querySelector(".dicepass-script")) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("inject.js");
    script.className = "dicepass-script";
    document.head.appendChild(script);
}

(new MutationObserver(() => setTimeout(scanPage, 500))).observe(document.body, { childList: true, subtree: true });
setTimeout(scanPage, 500);