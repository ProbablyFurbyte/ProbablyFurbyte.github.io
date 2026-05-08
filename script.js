const DISCORD_USER_ID = "416887610233847820"; 
const LANYARD_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

// --- 1. LANYARD STATUS & KLOK (Behouden) ---
async function updateStatus() {
    try {
        const response = await fetch(LANYARD_URL);
        const json = await response.json();
        const dot = document.getElementById('status-dot');
        const text = document.getElementById('discord-status-text');
        const label = document.getElementById('status-label');
        const statusBox = document.querySelector('.status-box');

        if (json.success) {
            const data = json.data;
            const status = data.discord_status;
            const colors = { online: '#43b581', idle: '#faa61a', dnd: '#f04747', offline: '#747f8d' };
            const currentColor = colors[status] || colors.offline;

            if (dot) {
                dot.style.backgroundColor = currentColor;
                dot.style.boxShadow = `0 0 10px ${currentColor}`;
            }
            if (label) label.textContent = status.toUpperCase();

            if (text) {
                text.classList.add('fade-out');
                setTimeout(() => {
                    // --- SPOTIFY LOGICA ---
                    if (data.listening_to_spotify && data.spotify) {
                        text.textContent = `Listening to ${data.spotify.song || data.spotify.track} by ${data.spotify.artist}`;
                        
                        if (statusBox) {
                            // Achtergrond instellen
                            statusBox.style.backgroundImage = `linear-gradient(rgba(30, 27, 36, 0.9), rgba(30, 27, 36, 0.9)), url('${data.spotify.album_art_url}')`;
                            statusBox.style.backgroundSize = 'cover';
                            
                            // NIEUW: Maak de box klikbaar
                            statusBox.classList.add('is-listening');
                            statusBox.onclick = () => {
                                window.open(`https://open.spotify.com/track/${data.spotify.track_id}`, '_blank');
                            };
                        }
                    } else {
                        // --- GEEN SPOTIFY ---
                        if (statusBox) {
                            statusBox.style.backgroundImage = 'none';
                            statusBox.classList.remove('is-listening');
                            statusBox.onclick = null; // Verwijder de klik-functie
                        }
                        const custom = data.activities.find(a => a.type === 4);
                        text.textContent = (custom && custom.state) ? `"${custom.state}"` : "Expert at doing nothing.";
                    }
                    text.classList.remove('fade-out');
                }, 400);
            }
        }
    } catch (e) { console.error(e); }
}

function updateClock() {
    const now = new Date();
    const options24 = { timeZone: 'Europe/Amsterdam', hour12: false, hour: '2-digit', minute: '2-digit' };
    const options12 = { timeZone: 'Europe/Amsterdam', hour12: true, hour: '2-digit', minute: '2-digit' };
    const time24 = new Intl.DateTimeFormat('nl-NL', options24).format(now);
    const time12 = new Intl.DateTimeFormat('en-US', options12).format(now);
    const clock24 = document.getElementById('clock-24');
    const clock12 = document.getElementById('clock-12');
    if (clock24) clock24.innerHTML = time24.replace(':', '<span>:</span>');
    if (clock12) clock12.textContent = time12;
}

// --- 2. NIEUW: GALLERY SLIDESHOW ---
// Pas deze lijst aan met je eigen foto's!
const galleryImages = [
    "./assets/images/byte-dark.jpg",
    "./assets/images/byte-camera.jpg",
    "./assets/images/byte-flex.jpg",
    "./assets/images/byte-room.jpg" 
];
let currentGalleryIndex = 0;
const galleryTarget = document.getElementById('gallery-target');

function cycleGallery() {
    if (!galleryTarget || galleryImages.length <= 1) return;

    // Fade out
    galleryTarget.classList.add('fade-out');

    // Wacht tot de fade-out klaar is (matcht CSS 0.5s)
    setTimeout(() => {
        // Volgende index, of terug naar 0
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
        // Verander de bron van de afbeelding
        galleryTarget.src = galleryImages[currentGalleryIndex];
        
        // Zorg dat de afbeelding geladen is voordat we fade-in doen
        galleryTarget.onload = () => {
            galleryTarget.classList.remove('fade-out');
        };
    }, 500);
}

// --- 3. NIEUW: THOUGHTS CYCLE ---
// Pas deze lijst aan met je favoriete quotes of gedachten!
const thoughtList = [
    "\"Silence is not empty, it's full of answers.\"",
    "\"Collect moments, not things.\"",
    "\"Protect your peace like it’s a physical treasure.\"",
    "\"Normality is a paved road: comfortable to walk, but no flowers grow on it.\"",
    "\"The soul usually knows what to do to heal itself. The challenge is to silence the mind.\"",
    "\"Everything you’ve ever wanted is on the other side of fear.\"",
    "\"Don't decrease the goal, increase the effort.\"",
    "\"Growth is uncomfortable because you’ve never been here before.\"",
    "\"Be the person you needed when you were younger.\"",
    "\"Your direction is more important than your speed.\"",
    "\"If you think you are too small to make a difference, try sleeping with a mosquito.\"",
    "\"Life is short. Smile while you still have teeth.\"",
    "\"Reality is a nice place, but I wouldn't want to live there.\"",
    "\"Be yourself; everyone else is already taken.\"",
    "\"I’m not lazy, I’m just on energy saving mode.\"",
    "\"We suffer more often in imagination than in reality.\"",
    "\"The sun is a daily reminder that we too can rise again from the darkness.\"",
    "\"To live is the rarest thing in the world. Most people exist, that is all.\"",
    "\"You cannot pour from an empty cup. Take care of yourself first.\"",
    "\"In a world where you can be anything, be kind.\""
];
let currentThoughtIndex = 0;
const quoteTarget = document.getElementById('quote-target');

function cycleThoughts() {
    if (!quoteTarget || thoughtList.length <= 1) return;

    // Fade out
    quoteTarget.classList.add('fade-out');

    // Wacht tot de fade-out klaar is (matcht CSS 0.5s)
    setTimeout(() => {
        // Volgende index, of terug naar 0
        currentThoughtIndex = (currentThoughtIndex + 1) % thoughtList.length;
        // Verander de tekst
        quoteTarget.textContent = thoughtList[currentThoughtIndex];
        
        // Fade in
        quoteTarget.classList.remove('fade-out');
    }, 500);
}

// --- START EN TIMERS ---
// Start Lanyard & Klok
updateStatus();
setInterval(updateStatus, 15000); // Check status elke 15s
updateClock();
setInterval(updateClock, 1000); // Check klok elke 1s

// Start Gallery Slideshow (Elke 10 seconden)
if (galleryTarget && galleryImages.length > 1) {
    setInterval(cycleGallery, 10000); 
}

// Start Thoughts Cycle (Elke 20 seconden)
if (quoteTarget && thoughtList.length > 1) {
    setInterval(cycleThoughts, 20000); 
}
