let styles = [];
chrome.storage.local.get('styles', (result) => {
    styles = (result.styles || []).slice(0, 1);

    let active = styles.filter(s => location.href.includes(s.url));
    let css = active.map(s => s.css).join("\n\n");

    if (css) {
        chrome.runtime.sendMessage({
            method: "installCSS",
            css
        });
    }
});

window.addEventListener("load", async () => {
    let page = document.body.innerText;
    if (page.startsWith("--styleme stylescript v1.0--") && location.href.startsWith("https://styleme.be.ax")) {
        console.log("[styleme] found stylescript on page!");

        // added to ensure each new loaded stylescript is installed
        chrome.storage.local.set({ styles: [] }, async () => {
            styles = [];
            let code = await stylescript.parse(page);
            if (styles.map(s => s.hash).includes(code.hash)) {
                return;
            }

            if (!code || !code.url || code.version !== 1.0 || !code.css || !code.title) {
                return alert("[ERROR] Unable to load this stylescript.")
            }
            let install = true;

            if (install) {
                console.log("[styleme] installing stylescript...");
                styles.push(code);

                chrome.storage.local.set({
                    styles
                }, () => {
                    try {
                        let url = new URL(code.url);
                        if (url.protocol === "http:" || url.protocol === "https:") {
                            let redir = true;
                            if (redir) {
                                console.log("[styleme] redirecting to stylescript url!");
                                location.href = code.url;
                            }
                        }
                    } catch (err) {}
                });
            }
        });
    }
}, false);

// Example stylescript:
/*
--styleme stylescript v1.0--
---------------
title: red background
url: http
version: 1.0
---------------

* {
    background-color: red !important;
}
*/

const stylescript = {};
stylescript.parse = async (content) => {
    let code = {};

    if (!content.startsWith("--styleme stylescript v1.0--\n----")) {
        return;
    }

    let sections = content.split("\n---------------\n").filter(Boolean);
    let metadata = sections[1];
    let css = sections[2]

    for (let line of metadata.split("\n").filter(Boolean)) {
        let split = line.split(":");
        let prop = split[0].trim().toLowerCase(),
            data = split.slice(1).join(":").trim();

        try {
            code[prop] = JSON.parse(data);
        }
        catch(err) {
            code[prop] = data;
        }
    }

    code.css = css.trim();
    code.hash = await sha1(`${code.title}|${code.url}|${code.css}`);
    code.original = content;

    return code;
};

const sha1 = async (str) => {
    let buf = new ArrayBuffer(str.length * 2);
    let bufView = new Uint16Array(buf);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }

    let hashBuf = await crypto.subtle.digest("SHA-1", buf);
    return [...new Uint8Array(hashBuf)].map(x => x.toString(16).padStart(2, '0')).join('');
}