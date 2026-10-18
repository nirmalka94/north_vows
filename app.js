/**
 * North Vows Photography Portfolio - Core Application Logic
 * Backed by a PHP + MySQL server API for permanent, shared storage.
 */

// ==========================================================================
// API Configuration
// Change API_BASE to '/api' when deployed to Hostinger.
// ==========================================================================
const API_BASE = '/api/index.php';

class APIManager {
    constructor() {
        this._passcode = '';
    }

    setPasscode(p) { this._passcode = p; }
    init() { return Promise.resolve(); }

    _get(action) {
        return fetch(`${API_BASE}?action=${action}`).then(r => r.json());
    }

    _post(action, body) {
        return fetch(`${API_BASE}?action=${action}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'X-Passcode': this._passcode },
            body:    JSON.stringify(body),
        }).then(r => r.json());
    }

    _postForm(action, formData) {
        return fetch(`${API_BASE}?action=${action}`, {
            method:  'POST',
            headers: { 'X-Passcode': this._passcode },
            body:    formData,
        }).then(r => r.json());
    }

    // Settings
    getSetting(key) {
        return this._get('get_settings').then(data => data[key] ?? null);
    }
    saveSetting(key, value) { return this._post('save_setting', { key, value }); }

    // Albums
    getAlbums()       { return this._get('get_albums'); }
    saveAlbum(album)  { return this._post('save_album', album); }
    deleteAlbum(id)   { return this._post('delete_album', { id }); }

    // Photos
    getPhotos()       { return this._get('get_photos'); }
    savePhoto(photo) {
        if (photo instanceof FormData) return this._postForm('upload_photo', photo);
        const fd = new FormData();
        Object.entries(photo).forEach(([k, v]) => fd.append(k, v));
        return this._postForm('upload_photo', fd);
    }
    deletePhoto(id)   { return this._post('delete_photo', { id }); }

    // Instagram
    getInstagramPosts()        { return this._get('get_instagram'); }
    saveInstagramPost(post)    { return this._post('save_instagram', post); }
    deleteInstagramPost(id)    { return this._post('delete_instagram', { id }); }

    // Passcode
    changePasscode(newPasscode) { return this._post('change_passcode', { newPasscode }); }
    clearAllData()  { return Promise.resolve(); }

    // Instagram Graph API
    syncInstagram()                { return this._post('sync_instagram', {}); }
    getInstagramStatus()           { return this._get('get_instagram_status'); }
    saveInstagramToken(token)      { return this._post('save_setting', { key: 'instagram_access_token', value: token }); }

    // Fetch all settings in one request
    getSettings()                  { return this._get('get_settings'); }

    // Upload a standalone image (hero bg, etc.) — returns { url }
    uploadImage(file) {
        const fd = new FormData();
        fd.append('file', file);
        return this._postForm('upload_image', fd);
    }
}

const db = new APIManager();


// ==========================================================================
// Predefined Sample Data (High Quality Placeholders)
// ==========================================================================
const SAMPLE_ALBUMS = [
    { id: 'album-weddings', slug: 'weddings', name: 'Fine Art Weddings', createdAt: Date.now() },
    { id: 'album-landscapes', slug: 'landscapes', name: 'Nordic Landscapes', createdAt: Date.now() + 1 },
    { id: 'album-portraits', slug: 'portraits', name: 'Editorial Portraits', createdAt: Date.now() + 2 }
];

const SAMPLE_PHOTOS = [
    // Weddings
    {
        id: 'photo-w1',
        albumId: 'album-weddings',
        title: 'Silent Vows',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
        aspect: 'portrait',
        altText: 'A bride standing in a garden with sunrays glowing through her veil, minimal aesthetic.',
        storageType: 'url',
        createdAt: Date.now()
    },
    {
        id: 'photo-w2',
        albumId: 'album-weddings',
        title: 'Quiet Embraces',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
        aspect: 'landscape',
        altText: 'Newlyweds hugging quietly near an old stone cathedral in black and white.',
        storageType: 'url',
        createdAt: Date.now() + 1
    },
    {
        id: 'photo-w3',
        albumId: 'album-weddings',
        title: 'The Bridal Veil',
        url: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?q=80&w=800',
        aspect: 'portrait',
        altText: 'Close up of a bridal dress back details and simple pearls.',
        storageType: 'url',
        createdAt: Date.now() + 2
    },
    // Landscapes
    {
        id: 'photo-l1',
        albumId: 'album-landscapes',
        title: 'Lofoten Calm',
        url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200',
        aspect: 'landscape',
        altText: 'Serene mountain range in Lofoten, Norway reflected in still ocean water.',
        storageType: 'url',
        createdAt: Date.now() + 3
    },
    {
        id: 'photo-l2',
        albumId: 'album-landscapes',
        title: 'Ethereal Whispers',
        url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=800',
        aspect: 'portrait',
        altText: 'Waves crashing softly on a black sand beach during twilight.',
        storageType: 'url',
        createdAt: Date.now() + 4
    },
    {
        id: 'photo-l3',
        albumId: 'album-landscapes',
        title: 'Stark Peaks',
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800',
        aspect: 'portrait',
        altText: 'Foggy, dark mountain ridge with minimal tree silhouettes.',
        storageType: 'url',
        createdAt: Date.now() + 5
    },
    // Portraits
    {
        id: 'photo-p1',
        albumId: 'album-portraits',
        title: 'Muted Expressions',
        url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800',
        aspect: 'portrait',
        altText: 'Editorial dark studio portrait of a man looking thoughtful in soft light.',
        storageType: 'url',
        createdAt: Date.now() + 6
    },
    {
        id: 'photo-p2',
        albumId: 'album-portraits',
        title: 'Editorial Contrast',
        url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1200',
        aspect: 'landscape',
        altText: 'Cinematic portrait of a woman standing in front of concrete minimalist architecture.',
        storageType: 'url',
        createdAt: Date.now() + 7
    }
];

const SAMPLE_INSTAGRAM = [
    {
        id: 'insta-1',
        imgUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600',
        caption: 'Whispers of the forest. Minimal landscapes from our Norway story. #minimalist #photography',
        likes: 245,
        postUrl: 'https://instagram.com',
        createdAt: Date.now()
    },
    {
        id: 'insta-2',
        imgUrl: 'https://images.unsplash.com/photo-1518049360964-6a417c16f047?q=80&w=600',
        caption: 'A quiet moment before the vows. Fine art wedding editorial. #weddingphotography',
        likes: 312,
        postUrl: 'https://instagram.com',
        createdAt: Date.now() + 1
    },
    {
        id: 'insta-3',
        imgUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600',
        caption: 'Natural light, muted tones, and pure emotion. Portrait sessions. #fineart #portraits',
        likes: 189,
        postUrl: 'https://instagram.com',
        createdAt: Date.now() + 2
    },
    {
        id: 'insta-4',
        imgUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=600',
        caption: 'Spring bloom in Iceland. Editorial travel documentation. #explore #nordic',
        likes: 402,
        postUrl: 'https://instagram.com',
        createdAt: Date.now() + 3
    },
    {
        id: 'insta-5',
        imgUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600',
        caption: 'Woven details and minimalist design. Captured in studio. #stilllife #creative',
        likes: 156,
        postUrl: 'https://instagram.com',
        createdAt: Date.now() + 4
    },
    {
        id: 'insta-6',
        imgUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600',
        caption: 'Sunset reflection on Lofoten shores. Stardust memories. #naturephotography',
        likes: 298,
        postUrl: 'https://instagram.com',
        createdAt: Date.now() + 5
    }
];

const DEFAULT_SETTINGS = {
    siteTitle: 'North Vows | Minimalist Fine Art Photography Portfolio',
    siteKeywords: 'Kitchener wedding photographer, Waterloo wedding photographer, Cambridge wedding photographer, Kitchener-Waterloo photographer, engagement photos Kitchener, family photographer Waterloo, headshots Kitchener, fine art photography Ontario',
    siteDesc: 'Wedding, engagement and portrait photographer serving Kitchener, Waterloo and Cambridge, Ontario. Minimal, elegant fine art photography by North Vows.',
    heroSubtitle: 'Fine Art Photography',
    heroTitle: 'Capturing Pure Devotion',
    heroDesc: 'We craft raw, minimalist visuals that preserve stories of quiet romance, stark natural beauty, and modern design.',
    aboutSubtitle: 'The Eye Behind The Lens',
    aboutTitle: 'We believe in quiet, meaningful details.',
    aboutDesc1: 'North Vows was founded on the philosophy of visual simplicity. We step back to let moments unfold naturally, focusing on light, space, and quiet connections that often go unnoticed in the rush of life.',
    aboutDesc2: 'Available worldwide for weddings, editorial campaigns, architectural portfolios, and select creative projects. Based in Kitchener, Ontario, serving Kitchener, Waterloo and Cambridge.',
    instaHandle: '@northvows_photo',
    instaAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
    whatsappNumber: '+12269894884',
    whatsappMessage: 'Hello North Vows, I would like to book a photography appointment.',
    photographerName: 'Abin',
    photographerRole: 'Founder & Lead Photographer',
    photographerBio: 'With 5 years of experience as a destination wedding photographer at Magicmotionmedia and Vows of Love, Abin brings a heartfelt, cinematic eye to every session. His work captures the quiet moments — a stolen glance, a tender touch — that tell the real story of your day.',
    studioPhone: '+1 (226) 989-4884',
    studioAddress: 'Kitchener, ON N2E 2K2',
    rateSession: '250',
    rateWedding: '500',
    heroImage: ''
};

// ==========================================================================
// Application State
// ==========================================================================
const state = {
    albums: [],
    photos: [],
    instagramPosts: [],
    settings: {},
    currentFilter: 'all',
    activeLightboxIndex: -1,
    filteredPhotos: []
};

// ==========================================================================
// Global Page Inits & DOM Element Cache
// ==========================================================================
function loadFallbackData() {
    state.albums = [...SAMPLE_ALBUMS];
    state.photos = [...SAMPLE_PHOTOS];
    state.instagramPosts = [...SAMPLE_INSTAGRAM];
    state.settings = { ...DEFAULT_SETTINGS };
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Bind event listeners immediately so the UI is responsive even if DB connection fails
    setupGlobalEventListeners();

    try {
        await db.init();
        await loadAndInitializeDatabase();
        await hydrateSiteUI();
    } catch (err) {
        console.warn('Database connection failed, using fallback/offline mode:', err);
        loadFallbackData();
        await hydrateSiteUI();
    }
});

/**
 * Loads all data from the DB. Falls back to in-memory sample data only when
 * the DB tables are empty — never writes anything without auth.
 * forceReset (admin "Reset" button): deletes all user content from DB then
 * restores defaults.
 */
async function loadAndInitializeDatabase(forceReset = false) {
    if (forceReset) {
        // Delete all user albums (cascades to photos on the server side)
        const existingAlbums = await db.getAlbums();
        for (const album of existingAlbums) {
            await db.deleteAlbum(album.id).catch(() => {});
        }
        // Delete remaining orphan photos
        const existingPhotos = await db.getPhotos();
        for (const photo of existingPhotos) {
            await db.deletePhoto(photo.id).catch(() => {});
        }
        // Delete instagram posts
        const existingInsta = await db.getInstagramPosts();
        for (const post of existingInsta) {
            await db.deleteInstagramPost(post.id).catch(() => {});
        }
        // Reset all settings to defaults (except passcode — keep the user's own)
        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
            if (key !== 'passcode') await db.saveSetting(key, value).catch(() => {});
        }
    }

    // Fetch everything from DB in one parallel batch (public GET — no auth needed)
    const [dbAlbums, dbPhotos, dbInsta, dbSettings] = await Promise.all([
        db.getAlbums(),
        db.getPhotos(),
        db.getInstagramPosts(),
        db.getSettings()
    ]);

    // Use DB content when available; fall back to sample data only when tables are empty
    state.albums         = dbAlbums.length        > 0 ? dbAlbums        : [...SAMPLE_ALBUMS];
    state.photos         = dbPhotos.length        > 0 ? dbPhotos        : [...SAMPLE_PHOTOS];
    state.instagramPosts = dbInsta.length         > 0 ? dbInsta         : [...SAMPLE_INSTAGRAM];

    state.albums.sort((a, b) => a.createdAt - b.createdAt);
    state.photos.sort((a, b) => a.createdAt - b.createdAt);
    state.instagramPosts.sort((a, b) => a.createdAt - b.createdAt);

    // Build settings: start from hardcoded defaults, then overlay anything saved in DB.
    // This guarantees state.settings never has null values that could crash hydrateSiteUI.
    state.settings = { ...DEFAULT_SETTINGS };
    if (dbSettings && typeof dbSettings === 'object') {
        for (const [key, val] of Object.entries(dbSettings)) {
            if (val !== null && val !== undefined && String(val).trim() !== '') {
                state.settings[key] = val;
            }
        }
    }
}

/**
 * Updates DOM contents, meta titles, layouts based on app State.
 */
async function hydrateSiteUI() {
    // 1. Meta & SEO tags
    document.title = state.settings.siteTitle;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', state.settings.siteDesc);
    
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute('content', state.settings.siteKeywords);
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', state.settings.siteTitle);
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', state.settings.siteDesc);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', state.settings.siteTitle);
    
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', state.settings.siteDesc);

    // Update JSON-LD structured data
    const schemaEl = document.getElementById('schemaData');
    if (schemaEl) {
        const schema = JSON.parse(schemaEl.textContent);
        schema.name = state.settings.siteTitle.split('|')[0].trim() + " Photography";
        schema.description = state.settings.siteDesc;
        schema.url = window.location.origin + '/';
        schemaEl.textContent = JSON.stringify(schema, null, 2);
    }

    // 2. Set Canonical URL
    const canonical = document.getElementById('canonicalUrl');
    if (canonical) {
        canonical.setAttribute('href', window.location.href.split('#')[0]);
    }

    // 3. Hero Layout Elements
    document.getElementById('heroSubtitle').textContent = state.settings.heroSubtitle;
    
    // Highlight first/second word if possible
    const titleVal = state.settings.heroTitle || DEFAULT_SETTINGS.heroTitle;
    const splitTitle = titleVal.split(' ');
    if (splitTitle.length > 1) {
        const lastWord = splitTitle.slice(1).join(' ');
        document.getElementById('heroTitle').innerHTML = `${splitTitle[0]} <span>${lastWord}</span>`;
    } else {
        document.getElementById('heroTitle').innerHTML = `<span>${titleVal}</span>`;
    }
    
    document.getElementById('heroDesc').textContent = state.settings.heroDesc;

    // Update Hero background: use explicitly set heroImage setting first, then fall back to first portfolio photo
    const heroBgImg = document.getElementById('heroBgImg');
    if (heroBgImg) {
        const heroSrc = state.settings.heroImage || (state.photos.length > 0 ? state.photos[0].url : '');
        if (heroSrc) heroBgImg.src = heroSrc;
    }

    // 4. About Bio Elements
    document.getElementById('aboutSubtitle').textContent = state.settings.aboutSubtitle;
    document.getElementById('aboutTitle').textContent = state.settings.aboutTitle;
    document.getElementById('aboutDesc1').textContent = state.settings.aboutDesc1;
    document.getElementById('aboutDesc2').textContent = state.settings.aboutDesc2;

    // 5. Photographer Section
    const photographerNameEl = document.getElementById('photographerNameDisplay');
    if (photographerNameEl) photographerNameEl.textContent = state.settings.photographerName || DEFAULT_SETTINGS.photographerName;
    const photographerRoleEl = document.getElementById('photographerRoleDisplay');
    if (photographerRoleEl) photographerRoleEl.textContent = state.settings.photographerRole || DEFAULT_SETTINGS.photographerRole;
    const photographerBioEl = document.getElementById('photographerBioDisplay');
    if (photographerBioEl) photographerBioEl.textContent = state.settings.photographerBio || DEFAULT_SETTINGS.photographerBio;

    // 6. Services & Investment Rates
    const rateSessionEl = document.getElementById('rateSessionDisplay');
    if (rateSessionEl) rateSessionEl.textContent = state.settings.rateSession || DEFAULT_SETTINGS.rateSession;
    const rateWeddingEl = document.getElementById('rateWeddingDisplay');
    if (rateWeddingEl) rateWeddingEl.textContent = state.settings.rateWedding || DEFAULT_SETTINGS.rateWedding;

    // 7. Contact Info Details
    const contactPhoneEl = document.getElementById('contactPhoneDisplay');
    if (contactPhoneEl) contactPhoneEl.textContent = state.settings.studioPhone || DEFAULT_SETTINGS.studioPhone;
    const contactAddressEl = document.getElementById('contactAddressDisplay');
    if (contactAddressEl) {
        const address = state.settings.studioAddress || DEFAULT_SETTINGS.studioAddress;
        contactAddressEl.textContent = address;
        contactAddressEl.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    const contactInstaEl = document.getElementById('contactInstaHandleDisplay');
    if (contactInstaEl) contactInstaEl.textContent = state.settings.instaHandle || DEFAULT_SETTINGS.instaHandle;

    // 8. Instagram Profile
    const instaHandle = state.settings.instaHandle || DEFAULT_SETTINGS.instaHandle;
    const instaAvatar = state.settings.instaAvatar || DEFAULT_SETTINGS.instaAvatar;
    document.getElementById('instaHandle').textContent = instaHandle;
    document.getElementById('instaAvatar').src = instaAvatar;
    document.getElementById('instaFollowBtn').href = `https://instagram.com/${instaHandle.replace('@', '')}`;

    // 9. Portfolio & Categories
    renderPortfolioNav();
    renderPortfolioGrid();

    // 10. Instagram feed cards
    renderInstagramFeedGrid();

    // 11. WhatsApp Floating Button Link Hydration
    const whatsappFloat = document.getElementById('whatsappFloat');
    if (whatsappFloat) {
        const number = (state.settings.whatsappNumber || '').replace(/[^\d+]/g, '');
        const msg = encodeURIComponent(state.settings.whatsappMessage || '');
        whatsappFloat.href = `https://wa.me/${number}?text=${msg}`;
    }
}

// ==========================================================================
// Portfolio & Grid Rendering
// ==========================================================================
function renderPortfolioNav() {
    const filtersContainer = document.getElementById('galleryFilters');
    
    // Save the active category slug
    const activeSlug = state.currentFilter;
    
    // Clear dynamic categories (keep "All Work" at start)
    filtersContainer.innerHTML = `<li class="filter-btn ${activeSlug === 'all' ? 'active' : ''}" data-filter="all">All Work</li>`;
    
    state.albums.forEach(album => {
        const li = document.createElement('li');
        li.className = `filter-btn ${activeSlug === album.slug ? 'active' : ''}`;
        li.dataset.filter = album.slug;
        li.textContent = album.name;
        filtersContainer.appendChild(li);
    });

    // Rebind filter buttons click listeners
    const buttons = filtersContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            renderPortfolioGrid();
        });
    });
}

function renderPortfolioGrid() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';

    // Filter photos matching current active category slug
    let photosToRender = [];
    if (state.currentFilter === 'all') {
        photosToRender = state.photos;
    } else {
        const selectedAlbum = state.albums.find(a => a.slug === state.currentFilter);
        if (selectedAlbum) {
            photosToRender = state.photos.filter(p => p.albumId === selectedAlbum.id);
        }
    }

    state.filteredPhotos = photosToRender;

    if (photosToRender.length === 0) {
        grid.innerHTML = `
            <div class="gallery-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="17" x2="15" y2="17"></line>
                    <line x1="9" y1="13" x2="15" y2="13"></line>
                    <line x1="9" y1="9" x2="13" y2="9"></line>
                </svg>
                <p>This album does not contain any photographs yet.</p>
            </div>
        `;
        return;
    }

    photosToRender.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = `gallery-item ${photo.aspect === 'landscape' ? 'landscape' : ''}`;
        
        // Find album name for subtitle overlay
        const album = state.albums.find(a => a.id === photo.albumId);
        const categoryLabel = album ? album.name : 'Fine Art';

        item.innerHTML = `
            <img src="${photo.url}" alt="${photo.altText}" class="gallery-img" loading="lazy">
            <div class="gallery-overlay">
                <span class="gallery-item-category">${categoryLabel}</span>
                <h3 class="gallery-item-title">${photo.title}</h3>
            </div>
        `;

        item.addEventListener('click', () => {
            openLightbox(index);
        });

        grid.appendChild(item);
    });
}

// ==========================================================================
// Lightbox Gallery Overlay
// ==========================================================================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxCategory = document.getElementById('lightboxCategory');

function openLightbox(index) {
    if (index < 0 || index >= state.filteredPhotos.length) return;

    state.activeLightboxIndex = index;
    const photo = state.filteredPhotos[index];

    // Find category label
    const album = state.albums.find(a => a.id === photo.albumId);
    const categoryLabel = album ? album.name : 'Fine Art';

    // Set content
    lightboxImg.src = photo.url;
    lightboxImg.alt = photo.altText;
    lightboxTitle.textContent = photo.title;
    lightboxCategory.textContent = categoryLabel;

    // Show lightbox
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}


function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function showNextPhoto() {
    if (state.filteredPhotos.length <= 1) return;
    let nextIndex = state.activeLightboxIndex + 1;
    if (nextIndex >= state.filteredPhotos.length) {
        nextIndex = 0; // Loop back
    }
    openLightbox(nextIndex);
}

function showPrevPhoto() {
    if (state.filteredPhotos.length <= 1) return;
    let prevIndex = state.activeLightboxIndex - 1;
    if (prevIndex < 0) {
        prevIndex = state.filteredPhotos.length - 1; // Loop end
    }
    openLightbox(prevIndex);
}

// ==========================================================================
// Instagram Simulated Live Feed Grid
// ==========================================================================
function renderInstagramFeedGrid() {
    const grid = document.getElementById('instagramGrid');
    grid.innerHTML = '';

    // Slice latest 6 posts to show
    const posts = state.instagramPosts.slice(-6).reverse();

    if (posts.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 3rem 0; color: var(--color-muted);">No feed posts configure yet.</div>`;
        return;
    }

    posts.forEach(post => {
        const item = document.createElement('a');
        item.href = post.postUrl || `https://instagram.com/${state.settings.instaHandle.replace('@', '')}`;
        item.target = '_blank';
        item.rel = 'noopener noreferrer';
        item.className = 'instagram-item';
        item.setAttribute('aria-label', `View Instagram post: ${post.caption.substring(0, 30)}...`);

        item.innerHTML = `
            <img src="${post.imgUrl}" alt="${post.caption}" class="instagram-img" loading="lazy">
            <div class="instagram-hover">
                <div class="instagram-stats">
                    <div class="instagram-stat-item">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>${post.likes}</span>
                    </div>
                </div>
                <p class="instagram-caption">${post.caption}</p>
            </div>
        `;

        grid.appendChild(item);
    });
}

// ==========================================================================
// Contact Form Submission Action
// ==========================================================================
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const name       = document.getElementById('contactName').value.trim();
        const email      = document.getElementById('contactEmail').value.trim();
        const eventType  = document.getElementById('contactEventType').value;
        const requirement= document.getElementById('contactRequirement').value;
        const date       = document.getElementById('contactDate').value;
        const message    = document.getElementById('contactMessage').value.trim();

        // Build a human-readable WhatsApp message
        let lines = ['Hello North Vows! I would like to enquire about your photography services.', ''];
        if (name)        lines.push(`Name: ${name}`);
        if (email)       lines.push(`Email: ${email}`);
        if (eventType)   lines.push(`Event Type: ${eventType}`);
        if (requirement) lines.push(`Requirement: ${requirement}`);
        if (date)        lines.push(`Date of Event: ${date}`);
        if (message)     lines.push('', message);

        const number = (state.settings.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber).replace(/[^\d+]/g, '');
        const url = `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;

        window.open(url, '_blank', 'noopener,noreferrer');
        contactForm.reset();
    });
}

// ==========================================================================
// Admin Control Panel logic
// ==========================================================================
const adminTrigger = document.getElementById('adminTrigger');
const adminModal = document.getElementById('adminModal');
const adminCloseBtn = document.getElementById('adminCloseBtn');
const adminLockscreen = document.getElementById('adminLockscreen');
const adminPassword = document.getElementById('adminPassword');
const adminUnlockBtn = document.getElementById('adminUnlockBtn');
const lockError = document.getElementById('lockError');

let isAdminUnlocked = false;

// Open settings dashboard
function openAdminPanel() {
    adminModal.classList.add('active');
    adminModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    if (!isAdminUnlocked) {
        adminLockscreen.classList.remove('unlocked');
        adminPassword.value = '';
        adminPassword.focus();
    } else {
        adminLockscreen.classList.add('unlocked');
        refreshAdminViews();
    }
}

// Close settings dashboard
function closeAdminPanel() {
    adminModal.classList.remove('active');
    adminModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Lock screen enter authentication
async function authenticateAdmin() {
    const pass = adminPassword.value;

    // --- Try live PHP API first ---
    try {
        const res = await fetch(`${API_BASE}?action=auth`, {
            method:  'POST',
            // Send passcode via BOTH header and body — LiteSpeed/WAF on some
            // hosts may strip the JSON body, so the header acts as a fallback.
            headers: { 'Content-Type': 'application/json', 'X-Passcode': pass },
            body:    JSON.stringify({ passcode: pass }),
        });

        // Only treat as a valid API response if Content-Type is JSON
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await res.json();
            // Log full server response to browser console for debugging
            console.log('[Admin Auth] Server response (HTTP ' + res.status + '):', data);

            if (data.success) {
                // ✅ Correct passcode — unlock dashboard
                db.setPasscode(pass);
                isAdminUnlocked = true;
                lockError.textContent = '';
                adminLockscreen.classList.add('unlocked');
                refreshAdminViews();
                loadInstagramApiStatus();
                showToast('Access Granted. Welcome!');

            } else if (res.status === 401) {
                // ❌ Wrong passcode (PHP explicitly rejected it)
                lockError.textContent = 'Invalid passcode. Try again.';
                adminPassword.value = '';
                adminPassword.focus();

            } else if (res.status === 500 || data.error) {
                // ⚠️ Server / database config error
                const msg = data.error || 'Unknown server error.';
                lockError.textContent = '⚠ Server error: ' + msg;
                console.error('[Admin Auth] Server error:', msg);

            } else {
                lockError.textContent = 'Unexpected response from server.';
            }
            return; // API handled it — stop here
        }

        // Non-JSON response — PHP not running, fall through to offline check
        console.warn('[Admin Auth] API did not return JSON (Content-Type: "' + contentType + '"). Switching to offline mode.');
    } catch (err) {
        // Network / fetch error — fall through to offline check
        console.warn('[Admin Auth] Network error — switching to offline mode:', err);
    }

    // --- Offline / local fallback: compare against locally stored passcode ---
    const storedPasscode = state.settings.passcode || DEFAULT_SETTINGS.passcode;
    if (pass === storedPasscode) {
        db.setPasscode(pass);
        isAdminUnlocked = true;
        lockError.textContent = '';
        adminLockscreen.classList.add('unlocked');
        refreshAdminViews();
        loadInstagramApiStatus();
        showToast('Access Granted (offline mode). Changes will not be saved to the database.');
    } else {
        lockError.textContent = 'Invalid passcode.';
        adminPassword.value = '';
        adminPassword.focus();
    }
}

// Logout / Lock dashboard again
function lockAdminDashboard() {
    isAdminUnlocked = false;
    adminLockscreen.classList.remove('unlocked');
    adminPassword.value = '';
    showToast('Dashboard Locked.');
}

// Tabs switching system in admin
const tabButtons = document.querySelectorAll('.admin-tab-btn');
const adminViews = document.querySelectorAll('.admin-view');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        adminViews.forEach(v => v.classList.remove('active'));
        
        btn.classList.add('active');
        const viewId = btn.dataset.tab;
        document.getElementById(viewId).classList.add('active');
    });
});

// Refresh all components in Admin View
function refreshAdminViews() {
    renderAdminAlbumsTable();
    renderAdminPhotoDropdowns();
    renderAdminPhotosTable();
    renderAdminInstagramTable();
    populateAdminSettingsForm();
}

// --- TAB 1: ALBUM MANAGEMENT LOGIC ---
const adminAlbumsTableBody = document.getElementById('adminAlbumsTableBody');
const newAlbumForm = document.getElementById('newAlbumForm');
const newAlbumName = document.getElementById('newAlbumName');

function renderAdminAlbumsTable() {
    adminAlbumsTableBody.innerHTML = '';
    
    state.albums.forEach(album => {
        // Count photos in this album
        const count = state.photos.filter(p => p.albumId === album.id).length;
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td style="font-weight:500;">${album.name}</td>
            <td><code>${album.slug}</code></td>
            <td>${count} items</td>
            <td class="action-btns">
                <button class="action-btn rename-album-btn" title="Rename Album" data-id="${album.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="action-btn delete delete-album-btn" title="Delete Album" data-id="${album.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        `;

        // Rename Action
        tr.querySelector('.rename-album-btn').addEventListener('click', async () => {
            const newName = prompt('Enter new album name:', album.name);
            if (newName && newName.trim() !== '') {
                album.name = newName.trim();
                album.slug = slugify(newName);
                await db.saveAlbum(album);
                state.albums = await db.getAlbums();
                refreshAdminViews();
                hydrateSiteUI();
                showToast('Album renamed successfully.');
            }
        });

        // Delete Action
        tr.querySelector('.delete-album-btn').addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete "${album.name}"? All photos in this album will be deleted as well!`)) {
                // Delete album
                await db.deleteAlbum(album.id);
                
                // Delete associated photos
                const photosToDelete = state.photos.filter(p => p.albumId === album.id);
                for (const photo of photosToDelete) {
                    await db.deletePhoto(photo.id);
                }
                
                // Refresh states
                state.albums = await db.getAlbums();
                state.photos = await db.getPhotos();
                
                // Reset filter if we deleted current filter
                if (state.currentFilter === album.slug) {
                    state.currentFilter = 'all';
                }

                refreshAdminViews();
                hydrateSiteUI();
                showToast('Album deleted successfully.');
            }
        });

        adminAlbumsTableBody.appendChild(tr);
    });
}

if (newAlbumForm) {
    newAlbumForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = newAlbumName.value.trim();
        const slug = slugify(name);
        
        // Prevent duplicate slugs
        if (state.albums.some(a => a.slug === slug)) {
            showToast('An album with a similar name already exists!', true);
            return;
        }

        const newAlbum = {
            id: 'album-' + Date.now(),
            name,
            slug,
            createdAt: Date.now()
        };

        await db.saveAlbum(newAlbum);
        state.albums = await db.getAlbums();
        
        newAlbumName.value = '';
        refreshAdminViews();
        hydrateSiteUI();
        showToast(`Album "${name}" created successfully.`);
    });
}

// --- TAB 2: PORTFOLIO PHOTO UPLOADS LOGIC ---
const photoAlbumDropdown = document.getElementById('photoAlbum');
const photoFilterAlbumDropdown = document.getElementById('photoFilterAlbum');
const adminPhotosTableBody = document.getElementById('adminPhotosTableBody');
const addPhotoForm = document.getElementById('addPhotoForm');
const uploadZone = document.getElementById('uploadZone');
const photoFileInput = document.getElementById('photoFileInput');
const uploadPreview = document.getElementById('uploadPreview');
const photoUrlInput = document.getElementById('photoUrl');
const photoTitleInput = document.getElementById('photoTitle');
const photoAspectInput = document.getElementById('photoAspect');
const photoAltInput = document.getElementById('photoAlt');

let loadedFile = null; // stores the actual File object for multipart upload

function renderAdminPhotoDropdowns() {
    // Clear
    photoAlbumDropdown.innerHTML = '';
    photoFilterAlbumDropdown.innerHTML = '<option value="all">Show All Albums</option>';
    
    state.albums.forEach(album => {
        const opt1 = document.createElement('option');
        opt1.value = album.id;
        opt1.textContent = album.name;
        photoAlbumDropdown.appendChild(opt1);
        
        const opt2 = document.createElement('option');
        opt2.value = album.id;
        opt2.textContent = album.name;
        photoFilterAlbumDropdown.appendChild(opt2);
    });

    // Handle filter dropdown change
    photoFilterAlbumDropdown.addEventListener('change', () => {
        renderAdminPhotosTable();
    });
}

function renderAdminPhotosTable() {
    adminPhotosTableBody.innerHTML = '';
    const filterId = photoFilterAlbumDropdown.value;
    
    let photos = state.photos;
    if (filterId !== 'all') {
        photos = state.photos.filter(p => p.albumId === filterId);
    }

    if (photos.length === 0) {
        adminPhotosTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--color-muted); padding: 2rem;">No photos found.</td></tr>`;
        return;
    }

    photos.forEach(photo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${photo.url}" alt="${photo.title}" class="admin-table-img"></td>
            <td style="font-weight:500;">${photo.title}</td>
            <td><span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--color-secondary);">${photo.aspect}</span></td>
            <td><code style="font-size:0.8rem;">${photo.storageType.toUpperCase()}</code></td>
            <td class="action-btns">
                <button class="action-btn delete delete-photo-btn" title="Delete Photo" data-id="${photo.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        `;

        tr.querySelector('.delete-photo-btn').addEventListener('click', async () => {
            if (confirm(`Remove photo "${photo.title}" from portfolio?`)) {
                await db.deletePhoto(photo.id);
                state.photos = await db.getPhotos();
                refreshAdminViews();
                hydrateSiteUI();
                showToast('Photo removed successfully.');
            }
        });

        adminPhotosTableBody.appendChild(tr);
    });
}

// Drag & Drop File Upload UI Events
if (uploadZone) {
    uploadZone.addEventListener('click', () => {
        photoFileInput.click();
    });
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleUploadedPhotoFile(e.dataTransfer.files[0]);
        }
    });

    photoFileInput.addEventListener('change', () => {
        if (photoFileInput.files.length > 0) {
            handleUploadedPhotoFile(photoFileInput.files[0]);
        }
    });
}

function handleUploadedPhotoFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', true);
        return;
    }

    loadedFile = file; // keep the real File object — sent as multipart on submit

    // FileReader is only for the preview thumbnail, not for submission
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadPreview.src = e.target.result;
        uploadPreview.style.display = 'block';
        photoUrlInput.value = '';
        showToast('Photo ready. Click "Add Photo to Gallery" to upload.');
    };
    reader.readAsDataURL(file);
}

// Add Photo Form Submit
if (addPhotoForm) {
    addPhotoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const albumId  = photoAlbumDropdown.value;
        const title    = photoTitleInput.value.trim();
        const aspect   = photoAspectInput.value;
        const altText  = photoAltInput.value.trim();

        let submitData;

        if (loadedFile) {
            // Option A: real file — send as multipart so PHP saves it to /uploads/
            const fd = new FormData();
            fd.append('file',    loadedFile);
            fd.append('albumId', albumId);
            fd.append('title',   title);
            fd.append('aspect',  aspect);
            fd.append('altText', altText);
            submitData = fd;
        } else if (photoUrlInput.value.trim() !== '') {
            // Option B: remote URL — send as JSON
            submitData = {
                id: 'photo-' + Date.now(),
                albumId,
                title,
                url:         photoUrlInput.value.trim(),
                aspect,
                altText,
                storageType: 'url',
                createdAt:   Date.now()
            };
        } else {
            showToast('Please upload a photo file or provide a remote image URL.', true);
            return;
        }

        try {
            const result = await db.savePhoto(submitData);
            if (result && result.error) {
                showToast('Upload failed: ' + result.error, true);
                return;
            }

            state.photos = await db.getPhotos();

            // Reset inputs
            addPhotoForm.reset();
            loadedFile = null;
            uploadPreview.style.display = 'none';
            uploadPreview.src = '';

            refreshAdminViews();
            hydrateSiteUI();
            showToast(`Photo "${title}" added successfully.`);
        } catch (err) {
            showToast('Upload error: ' + err.message, true);
        }
    });
}

// --- TAB 3: INSTAGRAM SIMULATION LOGIC ---
const editInstaHandle = document.getElementById('editInstaHandle');
const editInstaAvatar = document.getElementById('editInstaAvatar');
const instaSettingsForm = document.getElementById('instaSettingsForm');
const instaAddPostForm = document.getElementById('instaAddPostForm');
const adminInstaTableBody = document.getElementById('adminInstaTableBody');

const newInstaImg = document.getElementById('newInstaImg');
const newInstaCaption = document.getElementById('newInstaCaption');
const newInstaLikes = document.getElementById('newInstaLikes');

function renderAdminInstagramTable() {
    adminInstaTableBody.innerHTML = '';
    
    // Sort latest first
    const posts = [...state.instagramPosts].reverse();

    if (posts.length === 0) {
        adminInstaTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--color-muted); padding: 2rem;">No Instagram posts configured.</td></tr>`;
        return;
    }

    posts.forEach(post => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${post.imgUrl}" alt="Instagram image" class="admin-table-img"></td>
            <td><p style="font-size:0.85rem; max-width: 300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${post.caption}</p></td>
            <td>${post.likes}</td>
            <td class="action-btns">
                <button class="action-btn delete delete-insta-btn" title="Delete Post" data-id="${post.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        `;

        tr.querySelector('.delete-insta-btn').addEventListener('click', async () => {
            if (confirm('Delete this instagram post?')) {
                await db.deleteInstagramPost(post.id);
                state.instagramPosts = await db.getInstagramPosts();
                refreshAdminViews();
                hydrateSiteUI();
                showToast('Instagram post removed.');
            }
        });

        adminInstaTableBody.appendChild(tr);
    });
}

if (instaSettingsForm) {
    instaSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let handle = editInstaHandle.value.trim();
        if (!handle.startsWith('@')) handle = '@' + handle;
        
        const avatar = editInstaAvatar.value.trim();

        await db.saveSetting('instaHandle', handle);
        await db.saveSetting('instaAvatar', avatar);
        
        state.settings.instaHandle = handle;
        state.settings.instaAvatar = avatar;
        
        hydrateSiteUI();
        showToast('Instagram profile updated successfully.');
    });
}

if (instaAddPostForm) {
    instaAddPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const imgUrl = newInstaImg.value.trim();
        const caption = newInstaCaption.value.trim();
        const likes = parseInt(newInstaLikes.value, 10) || 0;

        const newPost = {
            id: 'insta-' + Date.now(),
            imgUrl,
            caption,
            likes,
            postUrl: `https://instagram.com/${state.settings.instaHandle.replace('@', '')}`,
            createdAt: Date.now()
        };

        await db.saveInstagramPost(newPost);
        state.instagramPosts = await db.getInstagramPosts();
        
        instaAddPostForm.reset();
        newInstaLikes.value = '120'; // Default fallback value
        
        refreshAdminViews();
        hydrateSiteUI();
        showToast('Instagram post added successfully.');
    });
}

// --- INSTAGRAM API AUTO-SYNC ---
const instaTokenForm       = document.getElementById('instaTokenForm');
const inputInstaToken      = document.getElementById('inputInstaToken');
const instaTokenStatus     = document.getElementById('instaTokenStatus');
const btnSyncInstagram     = document.getElementById('btnSyncInstagram');
const instaLastSyncStatus  = document.getElementById('instaLastSyncStatus');

function formatSyncTime(unixSeconds) {
    if (!unixSeconds) return 'Never synced';
    const diff = Math.floor((Date.now() / 1000) - unixSeconds);
    if (diff < 60)   return 'Synced just now';
    if (diff < 3600) return `Synced ${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `Synced ${Math.floor(diff / 3600)}h ago`;
    return `Synced ${Math.floor(diff / 86400)}d ago`;
}

async function loadInstagramApiStatus() {
    if (!instaTokenStatus || !instaLastSyncStatus) return;
    try {
        const status = await db.getInstagramStatus();
        if (status.token_set) {
            instaTokenStatus.textContent = '✓ Token connected';
            instaTokenStatus.style.color = '#6dbe80';
        } else {
            instaTokenStatus.textContent = 'No token saved yet.';
            instaTokenStatus.style.color = '';
        }
        instaLastSyncStatus.textContent = formatSyncTime(status.last_sync);
    } catch (_) {
        instaTokenStatus.textContent = 'Could not load token status.';
    }
}

if (instaTokenForm) {
    instaTokenForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = inputInstaToken.value.trim();
        if (!token) return;
        await db.saveInstagramToken(token);
        inputInstaToken.value = '';
        instaTokenStatus.textContent = '✓ Token saved.';
        instaTokenStatus.style.color = '#6dbe80';
        showToast('Instagram access token saved.');
    });
}

if (btnSyncInstagram) {
    btnSyncInstagram.addEventListener('click', async () => {
        btnSyncInstagram.disabled = true;
        btnSyncInstagram.textContent = '⏳ Syncing…';
        try {
            const result = await db.syncInstagram();
            if (result.success) {
                state.instagramPosts = await db.getInstagramPosts();
                refreshAdminViews();
                hydrateSiteUI();
                instaLastSyncStatus.textContent = 'Synced just now';
                showToast(`✓ Synced ${result.synced} post${result.synced !== 1 ? 's' : ''} from Instagram.`);
            } else {
                showToast('Sync failed: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            showToast('Sync error: ' + err.message);
        } finally {
            btnSyncInstagram.disabled = false;
            btnSyncInstagram.textContent = '↻ Sync Now from Instagram';
        }
    });
}

// --- TAB 4: SEO, SECURITY & DATA EXPORT LOGIC ---
const siteSettingsForm = document.getElementById('siteSettingsForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const btnExportConfig = document.getElementById('btnExportConfig');
const btnImportTrigger = document.getElementById('btnImportTrigger');
const btnResetDatabase = document.getElementById('btnResetDatabase');
const importArea = document.getElementById('importArea');
const importJsonInput = document.getElementById('importJsonInput');
const btnApplyImport = document.getElementById('btnApplyImport');

function populateAdminSettingsForm() {
    document.getElementById('settingSiteTitle').value = state.settings.siteTitle;
    document.getElementById('settingSiteKeywords').value = state.settings.siteKeywords;
    document.getElementById('settingSiteDesc').value = state.settings.siteDesc;
    
    document.getElementById('settingHeroSubtitle').value = state.settings.heroSubtitle;
    document.getElementById('settingHeroTitle').value = state.settings.heroTitle;
    document.getElementById('settingHeroDesc').value = state.settings.heroDesc;
    
    document.getElementById('settingAboutTitle').value = state.settings.aboutTitle;
    document.getElementById('settingAboutSubtitle').value = state.settings.aboutSubtitle;
    document.getElementById('settingAboutDesc1').value = state.settings.aboutDesc1;
    document.getElementById('settingAboutDesc2').value = state.settings.aboutDesc2;

    editInstaHandle.value = state.settings.instaHandle;
    editInstaAvatar.value = state.settings.instaAvatar;

    document.getElementById('settingPhotographerName').value = state.settings.photographerName || DEFAULT_SETTINGS.photographerName;
    document.getElementById('settingPhotographerRole').value = state.settings.photographerRole || DEFAULT_SETTINGS.photographerRole;
    document.getElementById('settingPhotographerBio').value = state.settings.photographerBio || DEFAULT_SETTINGS.photographerBio;

    document.getElementById('settingStudioPhone').value = state.settings.studioPhone || DEFAULT_SETTINGS.studioPhone;
    document.getElementById('settingStudioAddress').value = state.settings.studioAddress || DEFAULT_SETTINGS.studioAddress;

    document.getElementById('settingRateSession').value = state.settings.rateSession || DEFAULT_SETTINGS.rateSession;
    document.getElementById('settingRateWedding').value = state.settings.rateWedding || DEFAULT_SETTINGS.rateWedding;

    document.getElementById('settingWhatsappNumber').value = state.settings.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber;
    document.getElementById('settingWhatsappMessage').value = state.settings.whatsappMessage || DEFAULT_SETTINGS.whatsappMessage;

    // Hero image
    const heroImgInput = document.getElementById('settingHeroImage');
    const heroImgPreview = document.getElementById('heroImgPreview');
    if (heroImgInput) heroImgInput.value = state.settings.heroImage || '';
    if (heroImgPreview) {
        if (state.settings.heroImage) {
            heroImgPreview.src = state.settings.heroImage;
            heroImgPreview.style.display = 'block';
        } else {
            heroImgPreview.style.display = 'none';
        }
    }
}

if (siteSettingsForm) {
    siteSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fields = [
            'siteTitle', 'siteKeywords', 'siteDesc',
            'heroSubtitle', 'heroTitle', 'heroDesc',
            'aboutTitle', 'aboutSubtitle', 'aboutDesc1', 'aboutDesc2',
            'photographerName', 'photographerRole', 'photographerBio',
            'studioPhone', 'studioAddress',
            'rateSession', 'rateWedding',
            'whatsappNumber', 'whatsappMessage',
            'heroImage'
        ];

        for (const field of fields) {
            const val = document.getElementById(`setting${field.charAt(0).toUpperCase() + field.slice(1)}`).value.trim();
            await db.saveSetting(field, val);
            state.settings[field] = val;
        }

        hydrateSiteUI();
        showToast('Site settings and SEO titles updated.');
    });
}

// Hero image upload zone (inside Settings tab)
const heroImgUploadZone = document.getElementById('heroImgUploadZone');
const heroImgFileInput  = document.getElementById('heroImgFileInput');

if (heroImgUploadZone) {
    heroImgUploadZone.addEventListener('click', () => heroImgFileInput.click());
    heroImgUploadZone.addEventListener('dragover', (e) => { e.preventDefault(); heroImgUploadZone.classList.add('dragover'); });
    heroImgUploadZone.addEventListener('dragleave', () => heroImgUploadZone.classList.remove('dragover'));
    heroImgUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        heroImgUploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleHeroImageFile(e.dataTransfer.files[0]);
    });
}
if (heroImgFileInput) {
    heroImgFileInput.addEventListener('change', () => {
        if (heroImgFileInput.files.length > 0) handleHeroImageFile(heroImgFileInput.files[0]);
    });
}

async function handleHeroImageFile(file) {
    if (!file.type.startsWith('image/')) { showToast('Please select a valid image file.', true); return; }
    showToast('Uploading hero image…');
    try {
        const result = await db.uploadImage(file);
        if (result && result.url) {
            document.getElementById('settingHeroImage').value = result.url;
            const prev = document.getElementById('heroImgPreview');
            if (prev) { prev.src = result.url; prev.style.display = 'block'; }
            showToast('Hero image uploaded. Click "Save All Settings" to apply.');
        } else {
            showToast('Upload failed: ' + (result?.error || 'Unknown error'), true);
        }
    } catch (err) {
        showToast('Upload error: ' + err.message, true);
    }
}

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldPass = document.getElementById('oldPasscode').value;
        const newPass = document.getElementById('newPasscode').value.trim();

        if (newPass === '') {
            showToast('New passcode cannot be blank.', true);
            return;
        }

        // Verify old passcode then change via server API
        try {
            const verifyRes = await fetch(`${API_BASE}?action=auth`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ passcode: oldPass }),
            }).then(r => r.json());

            if (!verifyRes.success) {
                showToast('Current passcode is incorrect!', true);
                return;
            }

            await db.changePasscode(newPass);
            db.setPasscode(newPass);          // Keep session in sync
            state.settings.passcode = newPass;
            changePasswordForm.reset();
            showToast('Security passcode updated successfully.');
        } catch (err) {
            showToast('Failed to update passcode. Check connection.', true);
        }
    });
}

// Export Database JSON configuration
if (btnExportConfig) {
    btnExportConfig.addEventListener('click', async () => {
        try {
            const exportData = {
                settings: state.settings,
                albums: state.albums,
                photos: state.photos,
                instagram: state.instagramPosts
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "northvows_portfolio_db.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast('Database configuration exported.');
        } catch (err) {
            showToast('Failed to export configuration.', true);
        }
    });
}

// Toggle Import Area
if (btnImportTrigger) {
    btnImportTrigger.addEventListener('click', () => {
        importArea.style.display = importArea.style.display === 'none' ? 'block' : 'none';
        importJsonInput.value = '';
    });
}

// Apply Imported JSON
if (btnApplyImport) {
    btnApplyImport.addEventListener('click', async () => {
        const jsonStr = importJsonInput.value.trim();
        if (!jsonStr) {
            showToast('Please paste a valid database JSON string first.', true);
            return;
        }

        try {
            const data = JSON.parse(jsonStr);
            
            // Validate basic structure
            if (!data.settings || !data.albums || !data.photos || !data.instagram) {
                throw new Error('Missing keys in JSON structure.');
            }

            await db.clearAllData();
            
            // Hydrate Settings
            for (const [key, value] of Object.entries(data.settings)) {
                await db.saveSetting(key, value);
            }
            
            // Hydrate Albums
            for (const album of data.albums) {
                await db.saveAlbum(album);
            }

            // Hydrate Photos
            for (const photo of data.photos) {
                await db.savePhoto(photo);
            }

            // Hydrate Instagram
            for (const post of data.instagram) {
                await db.saveInstagramPost(post);
            }

            showToast('Import successful! Reloading page...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err) {
            showToast('Failed to import database. Check JSON syntax.', true);
            console.error(err);
        }
    });
}

// Reset database back to factory samples
if (btnResetDatabase) {
    btnResetDatabase.addEventListener('click', async () => {
        if (confirm('This will wipe out all your custom configurations, albums, and uploads, resetting the portfolio back to pre-loaded sample data. Proceed?')) {
            await loadAndInitializeDatabase(true);
            showToast('Database reset to defaults.');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    });
}

// ==========================================================================
// Helper Utility Functions
// ==========================================================================

/**
 * Creates clean web categories out of album names.
 */
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

/**
 * Visual feedback toast messages
 */
function showToast(message, isError = false) {
    const toast = document.getElementById('adminToast');
    const toastMsg = document.getElementById('toastMessage');
    
    if (isError) {
        toast.classList.add('error');
    } else {
        toast.classList.remove('error');
    }
    
    toastMsg.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3500);
}

// ==========================================================================
// Event Listeners Binding (Keyboard & Interaction)
// ==========================================================================
function setupGlobalEventListeners() {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // WhatsApp Floating Button scroll responsiveness
    const whatsappFloat = document.getElementById('whatsappFloat');
    let whatsappScrollTimeout = null;

    if (whatsappFloat) {
        // Initial visibility check
        if (window.scrollY > 150) {
            whatsappFloat.classList.remove('hidden');
        } else {
            whatsappFloat.classList.add('hidden');
        }

        window.addEventListener('scroll', () => {
            // Toggle visibility based on offset
            if (window.scrollY > 150) {
                whatsappFloat.classList.remove('hidden');
            } else {
                whatsappFloat.classList.add('hidden');
            }

            // Dim the button during active scroll
            whatsappFloat.classList.add('dimmed');

            // Restore full opacity after scrolling stops
            clearTimeout(whatsappScrollTimeout);
            whatsappScrollTimeout = setTimeout(() => {
                whatsappFloat.classList.remove('dimmed');
            }, 150);
        }, { passive: true });
    }

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    menuToggle.addEventListener('click', () => {
        const isActive = navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    // Close mobile menu on links click
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            
            // Highlight active link
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Scroll spy for Navbar active link
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });

    // Lightbox triggers
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxPrev = document.getElementById('lightboxPrev');

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', showNextPhoto);
    lightboxPrev.addEventListener('click', showPrevPhoto);
    
    // Close lightbox on click outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Keyboards shortcuts binding
    document.addEventListener('keydown', (e) => {
        // Lightbox hotkeys
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showNextPhoto();
            if (e.key === 'ArrowLeft') showPrevPhoto();
        }

        // Admin Modal Toggle Hotkey (Ctrl + Alt + A)
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            if (adminModal.classList.contains('active')) {
                closeAdminPanel();
            } else {
                openAdminPanel();
            }
        }
    });

    // Admin open triggers
    adminTrigger.addEventListener('click', openAdminPanel);
    adminCloseBtn.addEventListener('click', closeAdminPanel);
    adminLogoutBtn.addEventListener('click', lockAdminDashboard);
    
    // Close admin on overlay click
    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            closeAdminPanel();
        }
    });

    // Unlock Admin lockscreen
    adminUnlockBtn.addEventListener('click', authenticateAdmin);
    adminPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            authenticateAdmin();
        }
    });

    // Lightbox Mobile Touch Swipe Gestures
    let touchstartX = 0;
    let touchendX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchstartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchendX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, { passive: true });

    function handleSwipeGesture() {
        // Detect swipe threshold 50px
        if (touchendX < touchstartX - 50) {
            showNextPhoto(); // Swiped left -> Next
        }
        if (touchendX > touchstartX + 50) {
            showPrevPhoto(); // Swiped right -> Prev
        }
    }
}
