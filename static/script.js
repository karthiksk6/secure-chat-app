const socket = io();
let username = prompt("Enter your username");
let myKeyPair = null;
let knownKeys = {}; // recipientUsername -> publicKey

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ---------------------------
// 1. Generate RSA Key Pair
// ---------------------------
async function generateRSAKeyPair() {
    myKeyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    const exported = await crypto.subtle.exportKey("spki", myKeyPair.publicKey);
    const pem = btoa(String.fromCharCode(...new Uint8Array(exported)));

    // Register public key on server
    socket.emit("register_key", {
        username: username,
        public_key: pem
    });
}

// ---------------------------
// 2. Request Recipient's Public Key
// ---------------------------
function requestPublicKey(recipient) {
    if (!recipient) return;
    socket.emit("get_public_key", { recipient });
}

// ---------------------------
// 3. Encrypt and Send Message
// ---------------------------
async function sendMessage() {
    const msg = document.getElementById("message").value;
    const recipient = document.getElementById("recipient").value;

    if (!msg || !recipient) return;

    if (!knownKeys[recipient]) {
        alert("No public key found for " + recipient);
        return;
    }

    // Generate AES key
    const aesKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        encoder.encode(msg)
    );

    // Import recipient's RSA public key
    const binaryKey = Uint8Array.from(atob(knownKeys[recipient]), c => c.charCodeAt(0));
    const rsaKey = await crypto.subtle.importKey(
        "spki",
        binaryKey,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );

    // Encrypt AES key with recipient’s RSA public key
    const rawAes = await crypto.subtle.exportKey("raw", aesKey);
    const encryptedAes = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        rsaKey,
        rawAes
    );

    // Send encrypted payload
    socket.emit("send_encrypted", {
        sender: username,
        recipient: recipient,
        data: {
            iv: btoa(String.fromCharCode(...iv)),
            aes_key: btoa(String.fromCharCode(...new Uint8Array(encryptedAes))),
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
        }
    });

    // Animate confirmation
    const confirm = document.createElement("div");
    confirm.textContent = `✅ Message sent to ${recipient}`;
    confirm.classList.add("animate__animated", "animate__fadeInRight");
    document.getElementById("chat-box").appendChild(confirm);

    document.getElementById("message").value = '';
}

// ---------------------------
// 4. Receive Public Key
// ---------------------------
socket.on("receive_public_key", async (data) => {
    knownKeys[data.recipient] = data.public_key;

    const notice = document.createElement("div");
    notice.textContent = `🔐 Public key received from ${data.recipient}`;
    notice.classList.add("animate__animated", "animate__lightSpeedInLeft");
    document.getElementById("chat-box").appendChild(notice);
});

// ---------------------------
// 5. Receive and Decrypt Encrypted Message
// ---------------------------
socket.on("receive_encrypted", async (data) => {
    if (data.recipient !== username) return;

    const encrypted = data.data;

    const iv = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0));
    const aes_key_encrypted = Uint8Array.from(atob(encrypted.aes_key), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0));

    try {
        // Decrypt AES key using own private key
        const aes_raw = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            myKeyPair.privateKey,
            aes_key_encrypted
        );

        const aesKey = await crypto.subtle.importKey(
            "raw",
            aes_raw,
            { name: "AES-GCM" },
            true,
            ["decrypt"]
        );

        // Decrypt the message
        const plaintext = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            ciphertext
        );

        const message = decoder.decode(plaintext);

        // Animate message display
        const div = document.createElement("div");
        div.textContent = `[${data.sender}] ${message}`;
        div.classList.add("animate__animated", "animate__fadeInUp");
        document.getElementById("chat-box").appendChild(div);
    } catch (err) {
        console.error("Decryption failed", err);
    }
});

// ---------------------------
// 6. Handle Enter Key to Send
// ---------------------------
function handleKey(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// ---------------------------
// 7. On Load
// ---------------------------
generateRSAKeyPair();
