// ============================================================
//  ⚙️  SUPABASE CONFIG  — fill in your values from the dashboard
//  Dashboard → Project Settings → API
// ============================================================
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';       // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // long "anon public" key

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  1.  LANYARD — Discord status + Spotify
// ============================================================
const DISCORD_USER_ID = "416887610233847820";
const LANYARD_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

async function updateStatus() {
    try {
        const response = await fetch(LANYARD_URL);
        const json = await response.json();
        const dot       = document.getElementById('status-dot');
        const text      = document.getElementById('discord-status-text');
        const label     = document.getElementById('status-label');
        const statusBox = document.querySelector('.status-box');

        if (json.success) {
            const data   = json.data;
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
    } catch (e) { console.error('Lanyard error:', e); }
}

// ============================================================
//  2.  CLOCK
// ============================================================
function updateClock() {
    const now = new Date();
    const opts24 = { timeZone: 'Europe/Amsterdam', hour12: false, hour: '2-digit', minute: '2-digit' };
    const opts12 = { timeZone: 'Europe/Amsterdam', hour12: true,  hour: '2-digit', minute: '2-digit' };
    const time24 = new Intl.DateTimeFormat('nl-NL', opts24).format(now);
    const time12 = new Intl.DateTimeFormat('en-US', opts12).format(now);
    const clock24 = document.getElementById('clock-24');
    const clock12 = document.getElementById('clock-12');
    if (clock24) clock24.innerHTML = time24.replace(':', '<span>:</span>');
    if (clock12) clock12.textContent = time12;
}

// ============================================================
//  3.  GALLERY SLIDESHOW
// ============================================================
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
        galleryTarget.onload = () => galleryTarget.classList.remove('fade-out');
    }, 500);
}

// ============================================================
//  4.  GUESTBOOK
// ============================================================
const gbFeed   = document.getElementById('gb-feed');
const gbName   = document.getElementById('gb-name');
const gbMsg    = document.getElementById('gb-message');
const gbSubmit = document.getElementById('gb-submit');
const gbStatus = document.getElementById('gb-status');

// --- Load approved messages ---
async function loadGuestbook() {
    if (!gbFeed) return;

    const { data, error } = await _supabase
        .from('guestbook')
        .select('name, message, created_at')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Guestbook load error:', error);
        gbFeed.innerHTML = '<p class="gb-empty subtext">Could not load messages.</p>';
        return;
    }

    if (!data || data.length === 0) {
        gbFeed.innerHTML = '<p class="gb-empty subtext">No messages yet — be the first! 👋</p>';
        return;
    }

    gbFeed.innerHTML = data.map(entry => `
        <div class="gb-message">
            <strong>${escapeHtml(entry.name)}</strong>
            ${escapeHtml(entry.message)}
        </div>
    `).join('');
}

// --- Submit a new message ---
async function submitGuestbook() {
    const name    = gbName.value.trim();
    const message = gbMsg.value.trim();

    if (!name || !message) {
        setGbStatus('Please fill in both fields.', false);
        return;
    }

    gbSubmit.disabled = true;
    setGbStatus('Sending…', null);

    const { error } = await _supabase
        .from('guestbook')
        .insert([{ name, message }]);

    if (error) {
        console.error('Guestbook submit error:', error);
        setGbStatus('Something went wrong. Try again!', false);
    } else {
        gbName.value    = '';
        gbMsg.value     = '';
        setGbStatus('Message sent! It will appear after approval. ✨', true);
    }

    gbSubmit.disabled = false;
}

function setGbStatus(msg, success) {
    if (!gbStatus) return;
    gbStatus.textContent = msg;
    gbStatus.style.color = success === true  ? '#43b581'
                         : success === false ? '#f04747'
                         : 'var(--text-muted)';
}

// Prevent XSS
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Wire up submit button
if (gbSubmit) {
    gbSubmit.addEventListener('click', submitGuestbook);
}

// ============================================================
//  START
// ============================================================
updateStatus();
setInterval(updateStatus, 15000);

updateClock();
setInterval(updateClock, 1000);

if (galleryTarget && galleryImages.length > 1) {
    setInterval(cycleGallery, 10000);
}

loadGuestbook();
