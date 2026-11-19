# QRGenius - Free QR Code Generator

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A beautiful, professional QR code generator with a modern UI, smooth animations, and zero dependencies on a backend. Everything runs in the browser — your data never leaves your device.

## ✨ Features

- **8 content types** — Text, URL, Email, Phone, SMS, WiFi, vCard (contact), and Location
- **Fully customizable** — Size (128-1024px), colors, error correction level, and center logo
- **Instant generation** — Live preview as you type, with a scan-line animation
- **Dark mode** — Toggle between light and dark themes (remembered across visits)
- **Download & share** — Save as high-resolution PNG or copy straight to clipboard
- **100% private** — All generation happens locally in your browser, no servers involved
- **Responsive design** — Works beautifully on mobile, tablet, and desktop

## 🚀 Live Demo

[Deploy on Vercel](https://vercel.com/new) or visit your deployment URL after pushing to GitHub.

## 🛠️ Tech Stack

- Vanilla HTML5, CSS3, and JavaScript (no frameworks needed)
- [qrcodejs](https://github.com/davidshimjs/qrcodejs) (vendored locally in `js/`)
- Google Fonts (Inter)

## 📂 Project Structure

```
qr-generator/
├── index.html          # Main page
├── css/
│   └── style.css       # Styles & animations
├── js/
│   ├── qrcode.min.js   # QR generation library (local)
│   └── script.js       # App logic
├── assets/             # Static assets
├── README.md
└── .gitignore
```

## 🏃 Getting Started

No build step required. Just open the site:

```bash
# Option 1: Open directly in your browser
open index.html

# Option 2: Serve locally with any static server
python -m http.server 8080
```

## ☁️ Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: QRGenius QR code generator"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/qr-generator.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click **"Add New Project"** → import your `qr-generator` repo
   - Framework Preset: **Other** (static site, zero config needed)
   - Click **Deploy** — done! 🎉

## 📄 License

MIT License. Free to use, modify, and distribute.
