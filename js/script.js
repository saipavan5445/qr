(function () {
    'use strict';

    const typeSelect = document.getElementById('qr-type');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const qrCodeDiv = document.getElementById('qr-code');
    const qrFrame = document.getElementById('qr-frame');
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const scanLine = document.getElementById('scan-line');
    const previewMeta = document.getElementById('preview-meta');
    const toast = document.getElementById('toast');
    const charCount = document.getElementById('char-count');
    const sizeValue = document.getElementById('size-value');
    const themeToggle = document.getElementById('theme-toggle');
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const logoBtn = document.getElementById('logo-btn');
    const logoInput = document.getElementById('qr-logo');
    const logoRemove = document.getElementById('logo-remove');
    const logoBtnText = document.getElementById('logo-btn-text');

    let currentDataUrl = null;
    let currentQR = null;
    let selectedLogo = null;
    let debounceTimer = null;
    let toastTimer = null;

    const inputGroups = {
        text: 'text-input-group',
        url: 'url-input-group',
        email: 'email-input-group',
        phone: 'phone-input-group',
        sms: 'sms-input-group',
        wifi: 'wifi-input-group',
        vcard: 'vcard-input-group',
        location: 'location-input-group'
    };

    /* ---------- Theme ---------- */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('qr-theme', theme);
    }

    function initTheme() {
        const saved = localStorage.getItem('qr-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(saved || (prefersDark ? 'dark' : 'light'));
    }

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    /* ---------- Nav ---------- */
    window.addEventListener('scroll', () => {
        document.querySelector('.nav').classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

    /* ---------- Reveal on scroll ---------- */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    /* ---------- Stat counters ---------- */
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const duration = 1500;
            const start = performance.now();
            function tick(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(target * eased);
                if (progress < 1) requestAnimationFrame(tick);
                else el.textContent = target + (target === 1024 ? 'px' : '+');
            }
            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-value').forEach(el => counterObserver.observe(el));

    /* ---------- Toast ---------- */
    function showToast(message, type = 'success') {
        clearTimeout(toastTimer);
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    /* ---------- Input groups ---------- */
    function showInputGroup(type) {
        Object.values(inputGroups).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const active = document.getElementById(inputGroups[type]);
        if (active) {
            active.style.display = 'block';
            active.style.animation = 'fade-in 0.35s ease';
        }
    }

    /* ---------- Content builders ---------- */
    function getContent() {
        const type = typeSelect.value;
        switch (type) {
            case 'text':
                return document.getElementById('qr-content').value.trim();
            case 'url': {
                const url = document.getElementById('qr-url').value.trim();
                return url ? (url.startsWith('http') ? url : 'https://' + url) : '';
            }
            case 'email': {
                const email = document.getElementById('qr-email').value.trim();
                const subject = document.getElementById('qr-email-subject').value.trim();
                const body = document.getElementById('qr-email-body').value.trim();
                if (!email) return '';
                let result = 'mailto:' + email;
                const params = [];
                if (subject) params.push('subject=' + encodeURIComponent(subject));
                if (body) params.push('body=' + encodeURIComponent(body));
                if (params.length) result += '?' + params.join('&');
                return result;
            }
            case 'phone': {
                const phone = document.getElementById('qr-phone').value.trim();
                return phone ? 'tel:' + phone : '';
            }
            case 'sms': {
                const phone = document.getElementById('qr-sms-phone').value.trim();
                const body = document.getElementById('qr-sms-body').value.trim();
                if (!phone) return '';
                return 'sms:' + phone + (body ? '?body=' + encodeURIComponent(body) : '');
            }
            case 'wifi': {
                const ssid = document.getElementById('qr-wifi-ssid').value.trim();
                const password = document.getElementById('qr-wifi-password').value.trim();
                const encryption = document.getElementById('qr-wifi-encryption').value;
                const hidden = document.getElementById('qr-wifi-hidden').checked;
                if (!ssid) return '';
                return 'WIFI:T:' + encryption + ';S:' + ssid + ';P:' + password + ';H:' + (hidden ? 'true' : 'false') + ';;';
            }
            case 'vcard': {
                const name = document.getElementById('qr-vcard-name').value.trim();
                const phone = document.getElementById('qr-vcard-phone').value.trim();
                const email = document.getElementById('qr-vcard-email').value.trim();
                const org = document.getElementById('qr-vcard-org').value.trim();
                const title = document.getElementById('qr-vcard-title').value.trim();
                const url = document.getElementById('qr-vcard-url').value.trim();
                const address = document.getElementById('qr-vcard-address').value.trim();
                if (!name) return '';
                let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
                vcard += 'FN:' + name + '\n';
                if (phone) vcard += 'TEL:' + phone + '\n';
                if (email) vcard += 'EMAIL:' + email + '\n';
                if (org) vcard += 'ORG:' + org + '\n';
                if (title) vcard += 'TITLE:' + title + '\n';
                if (url) vcard += 'URL:' + url + '\n';
                if (address) vcard += 'ADR:;;' + address.replace(/\n/g, ';') + ';;;\n';
                vcard += 'END:VCARD';
                return vcard;
            }
            case 'location': {
                const lat = document.getElementById('qr-location-lat').value.trim();
                const lng = document.getElementById('qr-location-lng').value.trim();
                const label = document.getElementById('qr-location-label').value.trim();
                if (!lat || !lng) return '';
                return 'geo:' + lat + ',' + lng + (label ? '?q=' + encodeURIComponent(label) : '');
            }
        }
        return '';
    }

    /* ---------- Logo handling ---------- */
    logoBtn.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be under 2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                selectedLogo = img;
                logoBtnText.textContent = 'Logo added';
                logoBtn.style.borderColor = 'var(--success)';
                logoBtn.style.color = 'var(--success)';
                logoRemove.style.display = 'inline-flex';
                if (hasVisibleQR()) regenerate();
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });

    logoRemove.addEventListener('click', () => {
        selectedLogo = null;
        logoInput.value = '';
        logoBtnText.textContent = 'Upload Logo';
        logoBtn.style.borderColor = '';
        logoBtn.style.color = '';
        logoRemove.style.display = 'none';
        if (hasVisibleQR()) regenerate();
    });

    function hasVisibleQR() {
        return !qrFrame.classList.contains('hidden');
    }

    /* ---------- QR generation ---------- */
    function generateQRCode(showLoading = true) {
        const content = getContent();
        if (!content) {
            showToast('Please enter some content first', 'error');
            return;
        }

        const size = parseInt(document.getElementById('qr-size').value, 10);
        const ecc = document.getElementById('qr-ecc').value;
        const colorDark = document.getElementById('qr-color-dark').value;
        const colorLight = document.getElementById('qr-color-light').value;

        if (showLoading) {
            generateBtn.classList.add('loading');
            setTimeout(() => generateBtn.classList.remove('loading'), 500);
        }

        scanLine.classList.add('active');
        qrCodeDiv.innerHTML = '';
        qrFrame.classList.remove('hidden');
        qrPlaceholder.style.display = 'none';
        previewMeta.style.display = 'flex';

        try {
            currentQR = new QRCode(qrCodeDiv, {
                text: content,
                width: size,
                height: size,
                colorDark: colorDark,
                colorLight: colorLight,
                correctLevel: QRCode.CorrectLevel[ecc]
            });

            setTimeout(() => {
                const canvas = qrCodeDiv.querySelector('canvas');
                if (canvas) {
                    if (selectedLogo) drawLogoOnCanvas(canvas, size);
                    currentDataUrl = canvas.toDataURL('image/png');
                    downloadBtn.disabled = false;
                    copyBtn.disabled = false;
                }
            }, 60);

            setTimeout(() => scanLine.classList.remove('active'), 1600);
            if (showLoading) showToast('QR code generated!');
        } catch (e) {
            showToast('Failed to generate QR code', 'error');
            console.error(e);
        }
    }

    function roundRectPath(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function drawLogoOnCanvas(canvas, size) {
        const ctx = canvas.getContext('2d');
        const logoSize = size * 0.22;
        const pos = (size - logoSize) / 2;
        const cornerRadius = logoSize * 0.18;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        roundRectPath(ctx, pos - 4, pos - 4, logoSize + 8, logoSize + 8, cornerRadius + 4);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        roundRectPath(ctx, pos, pos, logoSize, logoSize, cornerRadius);
        ctx.clip();
        ctx.drawImage(selectedLogo, pos, pos, logoSize, logoSize);
        ctx.restore();

        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(pos, pos, logoSize, logoSize);
    }

    function regenerate() {
        if (hasVisibleQR()) generateQRCode(false);
    }

    /* ---------- Download & copy ---------- */
    function downloadQRCode() {
        if (!currentDataUrl) return;
        const link = document.createElement('a');
        link.download = 'qrcode-' + Date.now() + '.png';
        link.href = currentDataUrl;
        link.click();
        showToast('QR code downloaded!');
    }

    async function copyQRCode() {
        if (!currentDataUrl) return;
        try {
            const response = await fetch(currentDataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            showToast('QR code copied to clipboard!');
        } catch (e) {
            showToast('Clipboard not supported. Try downloading instead.', 'error');
        }
    }

    /* ---------- Live updates ---------- */
    function onInputChange() {
        const contentEl = document.getElementById('qr-content');
        if (contentEl && charCount) {
            charCount.textContent = contentEl.value.length;
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (hasVisibleQR()) generateQRCode(false);
        }, 400);
    }

    function onSizeChange() {
        const size = document.getElementById('qr-size').value;
        sizeValue.textContent = size;
    }

    /* ---------- Event wiring ---------- */
    typeSelect.addEventListener('change', (e) => showInputGroup(e.target.value));
    generateBtn.addEventListener('click', () => generateQRCode(true));
    downloadBtn.addEventListener('click', downloadQRCode);
    copyBtn.addEventListener('click', copyQRCode);

    document.getElementById('qr-size').addEventListener('input', onSizeChange);
    document.querySelectorAll('.input-groups input, .input-groups textarea, .input-groups select, #qr-size, #qr-ecc, #qr-color-dark, #qr-color-light').forEach(el => {
        el.addEventListener('input', onInputChange);
        el.addEventListener('change', onInputChange);
    });

    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                generateQRCode(true);
            }
        });
    });

    document.getElementById('year').textContent = new Date().getFullYear();

    /* ---------- Init ---------- */
    initTheme();
    showInputGroup('text');
})();
