const DISCORD_USER_ID = "416887610233847820"; 
const LANYARD_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

// --- SUPABASE SETUP ---
// !!! REPLACE THESE WITH YOUR EXACT URL AND PUBLISHABLE KEY !!!
const SUPABASE_URL = 'YOUR_URL_HERE'; 
const SUPABASE_KEY = 'YOUR_PUBLISHABLE_KEY_HERE';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 1. LANYARD STATUS & KLOK ---
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
                            statusBox.style.backgroundImage = `linear-gradient(rgba(30, 27, 36, 0.9), rgba(30, 27, 36, 0.9)), url('${data.spotify.album_art_url}')`;
                            statusBox.style.backgroundSize = 'cover';
                            
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
                            statusBox.onclick = null;
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

// --- 2. GALLERY SLIDESHOW ---
const galleryImages = [
    "./assets/images/byte-camera.jpg",
    "./assets/images/byte-profile.jpg" 
];
let currentGalleryIndex = 0;
const galleryTarget = document.getElementById('gallery-target');

function cycleGallery() {
    if (!galleryTarget || galleryImages.length <= 1) return;
    galleryTarget.classList.add('fade-out');
    setTimeout(() => {
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
        galleryTarget.src = galleryImages[currentGalleryIndex];
        
        galleryTarget.onload = () => {
            galleryTarget.classList.remove('fade-out');
        };
    }, 500);
}

// --- 3. GUESTBOOK LOGIC ---
const gbForm = document.getElementById('guestbook-form');
const gbList = document.getElementById('guestbook-list');

async function loadMessages() {
    if (!gbList) return;
    
    // Fetch only approved messages
    const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    if (error) {
        gbList.innerHTML = '<p class="subtext">Could not load messages.</p>';
        return;
    }

    gbList.innerHTML = ''; 
    if (data.length === 0) {
        gbList.innerHTML = '<p class="subtext">No messages yet. Be the first!</p>';
        return;
    }

    // Build the messages into the HTML
    data.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'gb-msg';
        div.innerHTML = `<span>${msg.name}</span><p>${msg.message}</p>`;
        gbList.appendChild(div);
    });
}

if (gbForm) {
    gbForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('gb-name');
        const msgInput = document.getElementById('gb-message');
        const btn = gbForm.querySelector('button');

        btn.innerText = '...'; 

        // Insert new message (defaults to unapproved)
        const { error } = await supabase
            .from('guestbook')
            .insert([{ name: nameInput.value, message: msgInput.value }]);

        if (!error) {
            alert("Thanks! Your message has been sent to Byte for approval 🫧");
            nameInput.value = '';
            msgInput.value = '';
        } else {
            alert("Oops, something went wrong.");
        }
        btn.innerText = 'Sign';
    });
}

// --- START EN TIMERS ---
updateStatus();
setInterval(updateStatus, 15000); 
updateClock();
setInterval(updateClock, 1000); 

if (galleryTarget && galleryImages.length > 1) {
    setInterval(cycleGallery, 10000); 
}

// Load guestbook messages on startup
loadMessages();
