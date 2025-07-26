# secure-chat-app
# 🔐 Secure Chat App with End-to-End Encryption

A browser-based real-time chat application with **end-to-end encryption** (E2EE) using **RSA** and **AES** encryption. Messages are encrypted on the sender side and only decrypted by the receiver—ensuring privacy even from the server.

## 🚀 Features

- 🔐 End-to-End Encrypted messaging (RSA + AES)
- 📡 Real-time chat using Flask-SocketIO
- 🎨 Clean, animated chat UI with classic color theme
- 🖥️ Messages are encrypted and decrypted **in the browser**
- 💾 Optional encrypted message logging (server-side)

## 🛠️ Tools & Technologies

- **Frontend**: HTML, CSS, JavaScript, Animate.css  
- **Backend**: Python, Flask, Flask-SocketIO  
- **Crypto**: Web Crypto API (RSA/AES)  
- **Deployment**: Render / GitHub Pages / Localhost

## 🧩 How It Works

1. Each user generates an RSA key pair in the browser.
2. Public keys are exchanged between users.
3. A random AES key is generated per message.
4. Message is encrypted using AES, and the AES key is encrypted using the recipient’s RSA public key.
5. Encrypted data is sent via Flask-SocketIO.
6. Recipient decrypts the AES key with their private RSA key and then decrypts the message.

## 📁 Project Structure
secure-chat-app/
├── app.py
├── templates/
│ └── index.html
├── static/
│ ├── script.js
  └── style.css

🌐 Deployment
You can deploy the app using:

Render

Heroku

PythonAnywhere





