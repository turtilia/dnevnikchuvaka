const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFSds3jxyVSlLoIiWklv0GtYiN5tU8aOzpo3CTCZrTA-1II6BKYPQiEeXYDaWafn1K5w/exec';

// --- 1. LIVE CLOCK ---
function updateClock() {
    const now = new Date();
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let seconds = String(now.getSeconds()).padStart(2, '0');
    
    const clockElement = document.getElementById('digital-clock');
    if (clockElement) {
        clockElement.textContent
