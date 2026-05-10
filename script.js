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
    "./assets/images/byte-camera.jpg",
    "./assets/images/byte-profile.jpg" 
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
    "\"Some people disappear quietly long before they actually leave.\"",
    "\"The worst feeling is realizing you meant more to someone in your head than in their life.\"",
    "\"Peace feels unfamiliar when chaos is all you've known.\"",
    "\"Late nights make honest thoughts louder.\"",
    "\"Not every sad person cries. Some just get quieter.\"",
    "\"You outgrow people when you start healing.\"",
    "\"Sometimes the strongest thing you can do is not react.\"",
    "\"Being needed is not the same as being loved.\"",
    "\"The older you get, the more silence starts to feel expensive.\"",
    "\"A tired soul needs more than sleep.\"",
    "\"You can miss people and still know they don't belong in your life anymore.\"",
    "\"Some versions of you only exist in someone else’s memories.\"",
    "\"There’s a difference between being alone and feeling alone.\"",
    "\"Growth often looks like losing people you thought would stay forever.\"",
    "\"The hardest battles are usually invisible.\"",
    "\"Comfort can become a prison without you noticing.\"",
    "\"Most people just want someone who truly listens.\"",
    "\"You don’t always need closure to move on.\"",
    "\"A calm mind is rarer than a successful life.\"",
    "\"Sometimes healing means becoming someone your past self wouldn’t recognize.\"",
    "\"People change slowly, then all at once.\"",
    "\"Not every connection is meant to last forever.\"",
    "\"The version of me you created in your mind is not my responsibility.\"",
    "\"Silence between two people can say everything words failed to.\"",
    "\"You learn a lot about people when you stop being useful to them.\"",
    "\"Some memories feel warmer than the people themselves ever did.\"",
    "\"The right people make you feel safe, not confused.\"",
    "\"Nobody talks about how lonely self-improvement can feel.\"",
    "\"You can be surrounded by people and still feel emotionally homeless.\"",
    "\"Sometimes your mind becomes the place you need saving from.\""
];
currentThoughtIndex = 0;
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
