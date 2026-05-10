// ============================================================
//  ⚙️  SUPABASE CONFIG
//  Dashboard → Project Settings → API
// ============================================================
const SUPABASE_URL      = 'https://jaxkfxoymsenvklczgqd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3o9HCY-80fMCxsUheo9dyw_wcYMnOmp';
const BUCKET            = 'gallery_images';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  1. LANYARD — Discord status + Spotify
// ============================================================
const DISCORD_USER_ID = "416887610233847820";
const LANYARD_URL     = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

async function updateStatus() {
    try {
        const response = await fetch(LANYARD_URL);
        const json     = await response.json();
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
                            statusBox.style.backgroundImage = `linear-gradient(rgba(30,27,36,0.9), rgba(30,27,36,0.9)), url('${data.spotify.album_art_url}')`;
                            statusBox.style.backgroundSize  = 'cover';
                            statusBox.classList.add('is-listening');
                            statusBox.onclick = () => window.open(`https://open.spotify.com/track/${data.spotify.track_id}`, '_blank');
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
//  2. CLOCK
// ============================================================
function updateClock() {
    const now    = new Date();
    const opts24 = { timeZone: 'Europe/Amsterdam', hour12: false, hour: '2-digit', minute: '2-digit' };
    const opts12 = { timeZone: 'Europe/Amsterdam', hour12: true,  hour: '2-digit', minute: '2-digit' };
    const clock24 = document.getElementById('clock-24');
    const clock12 = document.getElementById('clock-12');
    if (clock24) clock24.innerHTML = new Intl.DateTimeFormat('nl-NL', opts24).format(now).replace(':', '<span>:</span>');
    if (clock12) clock12.textContent = new Intl.DateTimeFormat('en-US', opts12).format(now);
}

// ============================================================
//  3. GALLERY SLIDESHOW — with metadata + lightbox
// ============================================================
let galleryPhotos       = [];   // [{filename, url, photographer, taken_at, world, type, notes}]
let currentGalleryIndex = 0;
const galleryTarget     = document.getElementById('gallery-target');
const galleryBadge      = document.getElementById('gallery-credit-badge');

// Load photo list from gallery_photos table (with metadata)
async function loadGalleryPhotos() {
    // Fetch metadata from the gallery_photos table
    const { data, error } = await _supabase
        .from('gallery_photos')
        .select('*')
        .order('taken_at', { ascending: false });

    if (error || !data || data.length === 0) {
        // Fallback: just show the local default image with no metadata
        galleryPhotos = [{ filename: null, url: './assets/images/byte-camera.jpg', photographer: null }];
    } else {
        galleryPhotos = data.map(row => {
            const { data: urlData } = _supabase.storage.from(BUCKET).getPublicUrl(row.filename);
            return { ...row, url: urlData.publicUrl };
        });
    }

    // Show the first one
    if (galleryTarget && galleryPhotos.length > 0) {
        showGalleryPhoto(0);
    }

    // Start cycling if more than one
    if (galleryPhotos.length > 1) {
        setInterval(cycleGallery, 10000);
    }
}

function showGalleryPhoto(index) {
    if (!galleryTarget) return;
    const photo = galleryPhotos[index];
    galleryTarget.src = photo.url;

    // Update credit badge
    if (galleryBadge) {
        if (photo.photographer) {
            galleryBadge.textContent = `📸 ${photo.photographer}`;
        } else {
            galleryBadge.textContent = '';
        }
    }
}

function cycleGallery() {
    if (!galleryTarget || galleryPhotos.length <= 1) return;
    galleryTarget.style.opacity = '0';
    setTimeout(() => {
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryPhotos.length;
        const photo = galleryPhotos[currentGalleryIndex];
        galleryTarget.src = photo.url;
        galleryTarget.onload = () => { galleryTarget.style.opacity = '1'; };
        // Also update badge immediately
        if (galleryBadge) {
            galleryBadge.textContent = photo.photographer ? `📸 ${photo.photographer}` : '';
        }
    }, 500);
}

// Lightbox
function openLightbox(photo) {
    const lb = document.getElementById('lightbox');
    if (!lb) return;

    document.getElementById('lightbox-img').src  = photo.url;
    document.getElementById('lb-photographer').textContent = photo.photographer || 'Unknown photographer';

    // Type badge
    const typeBadge = document.getElementById('lb-type');
    if (photo.type) {
        typeBadge.textContent  = photo.type;
        typeBadge.className    = 'lightbox-type-badge ' + (photo.type.toLowerCase().includes('vrchat') ? 'vrchat' : 'irl');
        typeBadge.style.display = '';
    } else {
        typeBadge.style.display = 'none';
    }

    // World
    const worldRow = document.getElementById('lb-world-row');
    if (photo.world) {
        document.getElementById('lb-world').textContent = photo.world;
        worldRow.style.display = '';
    } else {
        worldRow.style.display = 'none';
    }

    // Date
    const dateRow = document.getElementById('lb-date-row');
    if (photo.taken_at) {
        document.getElementById('lb-date').textContent = new Date(photo.taken_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
        dateRow.style.display = '';
    } else {
        dateRow.style.display = 'none';
    }

    // Notes
    const notesEl = document.getElementById('lb-notes');
    if (photo.notes) {
        notesEl.textContent  = photo.notes;
        notesEl.style.display = '';
    } else {
        notesEl.style.display = 'none';
    }

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
    // If called from backdrop click, only close if they clicked the backdrop itself
    if (e && e.target !== document.getElementById('lightbox')) return;
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('open');
    document.body.style.overflow = '';
}

// Wire up gallery click → lightbox
if (galleryTarget) {
    galleryTarget.style.cursor = 'pointer';
    galleryTarget.addEventListener('click', () => {
        const photo = galleryPhotos[currentGalleryIndex];
        if (photo) openLightbox(photo);
    }, true); // capture phase so pointer-events:none on img doesn't block it
}

// Also wire the gallery-box article itself so the whole area is clickable
const galleryBox = document.querySelector('.gallery-box');
if (galleryBox) {
    galleryBox.addEventListener('click', () => {
        const photo = galleryPhotos[currentGalleryIndex];
        if (photo) openLightbox(photo);
    });
}

// Close on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        const lb = document.getElementById('lightbox');
        if (lb && lb.classList.contains('open')) {
            lb.classList.remove('open');
            document.body.style.overflow = '';
        }
    }
});

// ============================================================
//  4. GUESTBOOK — spam protection + 2-message rotation
// ============================================================
const GB_RATE_KEY     = 'gb_last_submit';
const GB_COOLDOWN_MS  = 10 * 60 * 1000; // 10 minutes

const gbFeed   = document.getElementById('gb-feed');
const gbName   = document.getElementById('gb-name');
const gbMsg    = document.getElementById('gb-message');
const gbSubmit = document.getElementById('gb-submit');
const gbStatus = document.getElementById('gb-status');

let allMessages    = [];  // all approved messages fetched once
let shownIndices   = [];  // which two are currently visible

// Load all approved messages, then start the rotation
async function loadGuestbook() {
    if (!gbFeed) return;

    const { data, error } = await _supabase
        .from('guestbook')
        .select('name, message, created_at')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    if (error) {
        gbFeed.innerHTML = '<p class="gb-empty subtext">Could not load messages.</p>';
        return;
    }

    allMessages = data || [];

    if (allMessages.length === 0) {
        gbFeed.innerHTML = '<p class="gb-empty subtext">No messages yet — be the first! 👋</p>';
        return;
    }

    // Pick two random starting messages
    renderTwoMessages(pickTwo());

    // Swap one message every 8 seconds
    if (allMessages.length > 2) {
        setInterval(swapOneMessage, 8000);
    }
}

// Pick two non-duplicate indices
function pickTwo() {
    if (allMessages.length === 1) return [0];
    let a = Math.floor(Math.random() * allMessages.length);
    let b;
    do { b = Math.floor(Math.random() * allMessages.length); } while (b === a);
    return [a, b];
}

function renderTwoMessages(indices) {
    shownIndices = indices;
    gbFeed.innerHTML = indices.map((i, slot) => {
        const msg  = allMessages[i];
        const d    = msg.created_at ? new Date(msg.created_at) : null;
        const time = d
    ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Amsterdam' })
      + '<br>' +
      new Date(d).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
    : '';
        return `<div class="gb-message" id="gb-slot-${slot}">
            <span class="gb-meta">
                <strong>${escapeHtml(msg.name)}</strong>
                <span class="gb-time">${time}</span>
            </span>
            ${escapeHtml(msg.message)}
        </div>`;
    }).join('');
}

// Fade out one slot and fade in a new message
function swapOneMessage() {
    // Pick which slot to swap (0 or 1)
    const slot    = Math.random() < 0.5 ? 0 : 1;
    const slotEl  = document.getElementById(`gb-slot-${slot}`);
    if (!slotEl) return;

    // Pick a new index not currently shown
    let newIndex;
    let attempts = 0;
    do {
        newIndex = Math.floor(Math.random() * allMessages.length);
        attempts++;
    } while (shownIndices.includes(newIndex) && attempts < 20);

    if (newIndex === shownIndices[slot]) return; // nothing new to show

    slotEl.style.opacity = '0';
    setTimeout(() => {
        shownIndices[slot] = newIndex;
const msg  = allMessages[newIndex];
        const d    = msg.created_at ? new Date(msg.created_at) : null;
        const time = d
    ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Amsterdam' })
      + '<br>' +
      new Date(d).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
    : '';
        slotEl.innerHTML = `<span class="gb-meta">
            <strong>${escapeHtml(msg.name)}</strong>
            <span class="gb-time">${time}</span>
        </span>${escapeHtml(msg.message)}`;
        slotEl.style.opacity = '1';
    }, 500);
}

// Submit with spam protection
async function submitGuestbook() {
    const name    = gbName.value.trim();
    const message = gbMsg.value.trim();

    if (!name || !message) {
        setGbStatus('Please fill in both fields.', false); return;
    }

    // Rate limit check
    const lastSubmit = localStorage.getItem(GB_RATE_KEY);
    if (lastSubmit) {
        const elapsed = Date.now() - parseInt(lastSubmit, 10);
        if (elapsed < GB_COOLDOWN_MS) {
            const remaining = Math.ceil((GB_COOLDOWN_MS - elapsed) / 60000);
            setGbStatus(`Slow down! Try again in ~${remaining} min.`, false);
            return;
        }
    }

    gbSubmit.disabled = true;
    setGbStatus('Sending…', null);

    const { error } = await _supabase
        .from('guestbook')
        .insert([{ name, message }]);

    if (error) {
        setGbStatus('Something went wrong. Try again!', false);
    } else {
        localStorage.setItem(GB_RATE_KEY, Date.now().toString());
        gbName.value  = '';
        gbMsg.value   = '';
        setGbStatus('Sent! It will appear after approval ✨', true);
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

if (gbSubmit) gbSubmit.addEventListener('click', submitGuestbook);

// ============================================================
//  UTILS
// ============================================================
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ============================================================
//  START
// ============================================================
updateStatus();
setInterval(updateStatus, 15000);

updateClock();
setInterval(updateClock, 1000);

loadGalleryPhotos();
loadGuestbook();
