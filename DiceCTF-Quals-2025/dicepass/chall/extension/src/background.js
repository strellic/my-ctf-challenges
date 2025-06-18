const Comlink = require("comlink");
const { chromeRuntimeMessageEndpoint } = require("comlink-adapters");

console.log("[dicepass] Hello from dicepass background");

let encryptionKey = null;
async function deriveEncryptionKey(masterPassword) {
    const encoder = new TextEncoder();
    const data = encoder.encode(masterPassword);

    let { salt } = await chrome.storage.local.get(["salt"]);
    if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(16));
        chrome.storage.local.set({ salt: Array.from(salt) });
    }
    else {
        salt = new Uint8Array(salt);
    }

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        data,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
    
    const encryptionKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000, 
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
    
    return encryptionKey;
}

async function encrypt(key, text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );
    const ivHex = Array.from(iv).map(byte => byte.toString(16).padStart(2, '0')).join('');
    const dataHex = Array.from(new Uint8Array(encrypted)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    return ivHex + "|" + dataHex;
}

async function decrypt(key, enc) {
    const [ivHex, dataHex] = enc.split("|");
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const data = new Uint8Array(dataHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

const contentContext = {
    async getLogin(id) {
        const { origins = {} } = await chrome.storage.session.get("origins");
        const origin = origins[id];
        if (!origin || !encryptionKey) {
            return null;
        }

        const { vault = [] } = await chrome.storage.local.get("vault");
        for (const entry of vault) {
            if (await decrypt(encryptionKey, entry.origin) === origin) {
                return {
                    username: await decrypt(encryptionKey, entry.username),
                    password: await decrypt(encryptionKey, entry.password),
                };
            }
        }

        return null;
    },
    async hasPasswordFor(id) {
        const { origins = {} } = await chrome.storage.session.get("origins");
        const origin = origins[id];
        if (!origin) {
            return false;
        }

        const { vault = [] } = await chrome.storage.local.get("vault");
        for (const entry of vault) {
            if (await decrypt(encryptionKey, entry.origin) === origin) {
                return true;
            }
        }
        return false;
    },
    async add(id, username, password) {
        const { origins = {} } = await chrome.storage.session.get("origins");
        const origin = origins[id];
        if (!origin || !encryptionKey) {
            return;
        }

        const { vault = [] } = await chrome.storage.local.get("vault");
        vault.push({
            origin: await encrypt(encryptionKey, origin),
            username: await encrypt(encryptionKey, username),
            password: await encrypt(encryptionKey, password),
        });
        chrome.storage.local.set({ vault });
    },
    isLoggedIn() {
        return Boolean(encryptionKey)
    },
};

const popupContext = {
    async initialized() {
        const { initialized } = await chrome.storage.local.get("initialized");
        return Boolean(initialized);
    },
    async initialize(password) {
        if (await this.initialized() || encryptionKey || !password) {
            return false;
        }

        encryptionKey = await deriveEncryptionKey(password);
        chrome.storage.local.set({ initialized: await encrypt(encryptionKey, "initialized") });
        await popupContext.add("https://dicepass.dicec.tf", "test_user", "test_password");

        return true;
    },
    async isLoggedIn() {
        return Boolean(encryptionKey);
    },
    async login(password) {
        const { initialized } = await chrome.storage.local.get("initialized");
        if (!initialized || !password) {
            return false;
        }

        const key = await deriveEncryptionKey(password);
        try {
            if (await decrypt(key, initialized) === "initialized") {
                encryptionKey = key;
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    },
    async logout() {
        chrome.storage.session.clear();
        encryptionKey = null;
    },
    async clear() {
        chrome.storage.local.clear();
        chrome.storage.session.clear();
        encryptionKey = null;
    },
    async vault() {
        const { vault = [] } = await chrome.storage.local.get("vault");
        const result = [];

        for (const entry of vault) {
            const origin = await decrypt(encryptionKey, entry.origin);
            const username = await decrypt(encryptionKey, entry.username);
            result.push({ origin, username });
        }

        return result;
    },
    async reveal(origin, masterPassword) {
        if (!await this.login(masterPassword)) {
            return { error: "Invalid master password" };
        }

        const { vault = [] } = await chrome.storage.local.get("vault");
        const key = await deriveEncryptionKey(masterPassword);
        for (const entry of vault) {
            if (await decrypt(key, entry.origin) === origin) {
                const password = await decrypt(key, entry.password);
                return { error: false, password };
            }
        }

        return { error: "No password found for origin" };
    },
    async add(origin, username, password) {
        const { vault = [] } = await chrome.storage.local.get("vault");
        vault.push({
            origin: await encrypt(encryptionKey, origin),
            username: await encrypt(encryptionKey, username),
            password: await encrypt(encryptionKey, password),
        });
        chrome.storage.local.set({ vault });
    },
    async remove(origin) {
        const { vault = [] } = await chrome.storage.local.get("vault");
        for (let i = 0; i < vault.length; i++) {
            if (await decrypt(encryptionKey, vault[i].origin) === origin) {
                vault.splice(i, 1);
                break;
            }
        }
        chrome.storage.local.set({ vault });
    }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === "init-popup" && sender.url === "chrome-extension://" + chrome.runtime.id + "/popup.html") {
        Comlink.expose(popupContext, chromeRuntimeMessageEndpoint());
        sendResponse("ok");
    }
    else if (message === "init-content" && sender.origin && sender.tab && sender.tab.id) {
        Comlink.expose(contentContext, chromeRuntimeMessageEndpoint({ tabId: sender.tab.id }));
        const { origins = {} } = chrome.storage.session.get("origins");
        origins[sender.tab.id] = sender.origin;
        chrome.storage.session.set({ origins });
        sendResponse(sender.tab.id);
    }
    return true;
});