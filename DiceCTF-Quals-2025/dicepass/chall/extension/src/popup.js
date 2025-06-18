const Comlink = require("comlink");
const { chromeRuntimeMessageEndpoint } = require("comlink-adapters");

console.log('[dicepass] Hello from dicepass popup');

const $ = document.querySelector.bind(document);

window.addEventListener("load", async () => {
    console.log("[dicepass] popup loaded");

    await Promise.race([
        chrome.runtime.sendMessage('init-popup'),
        new Promise((resolve) => setTimeout(resolve, 200))
    ]);

    const remote = Comlink.wrap(chromeRuntimeMessageEndpoint());

    if (!await remote.initialized()) {
        $('#container').style.display = 'flex';
        $('#subtitle').innerText = 'Enter a master password to get started';
        $('#register-form').style.display = 'block';
        $('#register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const masterPassword = $('#register-form input[type="password"]').value;
            if (!masterPassword) {
                return;
            }

            if (await remote.initialize(masterPassword)) {
                location.reload();
                return;
            }
            alert("Failed to initialize");
        });
        return;
    }

    if (!await remote.isLoggedIn()) {
        $('#container').style.display = 'flex';
        $('#subtitle').innerText = 'Enter your master password to log in';
        $('#login-form').style.display = 'block';
        $('#login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const masterPassword = $('#login-form input[type="password"]').value;
            if (!masterPassword) {
                return;
            }

            if (await remote.login(masterPassword)) {
                location.reload();
                return;
            }
            alert("Invalid password");
            $('#login-form input[type="password"]').value = '';
        });
        return;
    }

    $('#container').style.display = 'flex';
    $('#subtitle').innerText = 'Welcome to dicepass';
    $('#auth-view').style.display = 'block';

    $('#logout').addEventListener('click', async () => {
        await remote.logout();
        location.reload();
    });
    
    $('#clear').addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear all data?")) {
            await remote.clear();
            location.reload();
        }
    });

    $('#new-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const website = $('#new-form input[type="url"]').value;
        const username = $('#new-form input[type="text"]').value;
        const password = $('#new-form input[type="password"]').value;

        if (!website || !username || !password) {
            return;
        }

        const origin = new URL(website).origin;
        await remote.add(origin, username, password);
        location.reload();
    });

    const vault = await remote.vault();
    if (vault.length === 0) {
        $('#vault').innerText = 'No passwords saved';
        return;
    }

    const table = document.createElement('table');
    const rows = [["", "Domain", "Username", "Password"]];
    for (const { origin, username } of vault) {
        rows.push(["🗑️", origin, username, ""]);
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const tr = document.createElement('tr');
        for (let j = 0; j < row.length; j++) {
            const elem = document.createElement(i === 0 ? 'th' : 'td');
            if (i === 0) {
                elem.innerText = row[j];
                tr.appendChild(elem);
                continue;
            }

            if (j === 0) {
                const a = document.createElement('a');
                a.innerText = row[j];
                a.href = '#';
                a.addEventListener('click', async () => {
                    if (confirm("Are you sure you want to delete this password?")) {
                        await remote.remove(row[1]);
                        location.reload();
                    }
                });
                elem.appendChild(a);
            }
            else if (j === 3) {
                const a = document.createElement('a');
                a.innerText = '********';
                a.href = '#';
                a.addEventListener('click', async () => {
                    const masterPassword = prompt("Please re-enter your master password:");
                    if (!masterPassword) {
                        return;
                    }

                    const result = await remote.reveal(row[1], masterPassword);
                    if (result.error) {
                        alert(result.error);
                        return;
                    }
                    prompt("Your password for " + row[1] + " is: ", result.password);
                });
                elem.appendChild(a);
            }
            else {
                elem.innerText = row[j];
            }

            tr.appendChild(elem);
        }
        table.appendChild(tr);
    }
    $('#vault').appendChild(table);
});