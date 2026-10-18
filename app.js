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

    // Portfolio carousel folders (Photo_carousel/<Category>/)
    uploadCarouselPhoto(formData)      { return this._postForm('carousel_upload', formData); }
    removeCarouselPhoto(category, file) { return this._post('carousel_remove', { category, file }); }

    // Upload a standalone image (hero bg, etc.) — returns { url }
    async uploadImage(file) {
        const fd = new FormData();
        fd.append('file', await compressImage(file));
        return this._postForm('upload_image', fd);
    }
}

const db = new APIManager();


// ==========================================================================
// Sample Data — only used in local preview mode (?demo in the URL).
// The live site never shows these; empty sections stay hidden instead.
// ==========================================================================
const DEMO_MODE = new URLSearchParams(window.location.search).has('demo');

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
    siteTitle: 'North Vows Photography | Wedding & Family Photographer in Kitchener-Waterloo',
    siteKeywords: 'Kitchener wedding photographer, Waterloo wedding photographer, Cambridge wedding photographer, Kitchener-Waterloo photographer, engagement photos Kitchener, family photographer Waterloo, headshots Kitchener, fine art photography Ontario',
    siteDesc: 'Wedding, family and portrait photographer in Kitchener, Waterloo and Cambridge, Ontario. Natural, timeless photography for clients across Canada.',
    heroSubtitle: 'Kitchener · Waterloo · Cambridge',
    heroTitle: 'Wedding & Family | Photographer', // '|' marks the line break
    heroDesc: 'Natural, timeless photos of your wedding, your family and the moments in between. Based in Kitchener-Waterloo, available across Canada.',
    aboutSubtitle: 'The Eye Behind The Lens',
    aboutTitle: 'We believe in quiet, meaningful details.',
    aboutDesc1: 'North Vows was founded on the philosophy of visual simplicity. We step back to let moments unfold naturally, focusing on light, space, and quiet connections that often go unnoticed in the rush of life.',
    aboutDesc2: 'We photograph weddings, families, portraits and professional headshots across Canada. Based in Kitchener, Ontario, we serve Kitchener, Waterloo, Cambridge and the surrounding region.',
    instaHandle: '@thenorthvows',
    instaAvatar: 'Assets/logo-sm.png',
    whatsappNumber: '+12269894884',
    whatsappMessage: 'Hello North Vows, I would like to book a photography appointment.',
    photographerName: 'Abin',
    photographerRole: 'Founder & Lead Photographer',
    photographerBio: 'With 5 years of experience as a destination wedding photographer at Magicmotionmedia and Vows of Love, Abin brings a heartfelt, cinematic eye to every session. His work captures the quiet moments — a stolen glance, a tender touch — that tell the real story of your day.',
    studioPhone: '+1 (226) 989-4884',
    studioEmail: 'thenorthvows@gmail.com',
    studioAddress: 'Kitchener, ON N2E 2K2',
    heroImage: '',
    heroSlideSeconds: '2',
    googleReviewsUrl: '',
    googleReadReviewsUrl: '',
    gaMeasurementId: '',
    // Lists below are stored as JSON strings in nv_settings and edited in
    // Admin → "Pricing, Reviews & FAQ".
    // Starting-price plans. Every other event type gets the "tailor-made" card,
    // which is always shown below these.
    packages: JSON.stringify([
        {
            name: 'Mini Sessions',
            priceNote: 'Starting from',
            price: '100',
            tagline: 'A short, relaxed shoot that fits into a busy week.',
            includes: 'Ideal for couples, solo portraits and seasonal photos\nRelaxed and guided, no posing experience needed\nHand-edited, high-resolution photos',
            eventType: '',
            ctaLabel: 'Book a mini session',
            featured: false
        },
        {
            name: 'Family Sessions',
            priceNote: 'Starting from',
            price: '200',
            tagline: 'Natural, unposed photos of the people who matter most.',
            includes: 'Families of every size, kids and pets welcome\nAt home, in a park, or at your favourite spot\nHand-edited, high-resolution photos',
            eventType: 'Family Session',
            ctaLabel: 'Book a family session',
            featured: false
        },
        {
            name: 'Weddings',
            priceNote: 'Starting from',
            price: '500',
            tagline: 'Your day told honestly, from the quiet moments to the celebration.',
            includes: 'Coverage built around your day and your timeline\nPersonal planning help before the wedding\nPhotography, videography, or both\nFull digital gallery to share with family',
            eventType: 'Wedding',
            ctaLabel: 'Check my date',
            featured: true
        }
    ]),
    faqs: JSON.stringify([
        {
            q: 'Which areas do you cover? Is there a travel fee?',
            a: 'We are based in Kitchener and travel within Kitchener, Waterloo and Cambridge at no extra cost. For other locations in Ontario and across Canada, we add a travel fee that we quote upfront. We only take bookings within Canada.'
        },
        {
            q: 'How soon will we receive our photos?',
            a: 'Delivery depends on the size of your event. We agree a delivery date with you when we plan your package, so you know exactly when to expect your gallery.'
        },
        {
            q: 'How do we book our date?',
            a: 'Send us your date through the form or WhatsApp. Once we confirm availability, a signed agreement and a retainer secure your date. The balance is due one week before the event.'
        },
        {
            q: 'How many photos will we get?',
            a: 'It depends on the package and the length of your session. We confirm it with you before you book, so there are no surprises. Every image is individually edited, never just filtered.'
        },
        {
            q: 'Do you offer videography?',
            a: 'Yes. Videography is available on its own or together with photography. Choose "Photography + Videography" in the contact form and we will send a combined quote.'
        },
        {
            q: 'Can we print our photos?',
            a: 'Yes. Every gallery comes with high-resolution downloads and a personal print release, so you can print anywhere you like.'
        }
    ]),
    testimonials: '[]',
    stories: '[]'
};

// Shown only in preview mode so the layout can be reviewed before real content exists.
const DEMO_CONTENT = {
    testimonials: [
        { names: 'Sample Couple A', event: 'Wedding · Sample venue, Cambridge', quote: 'Sample review text. Replace this with a real review from a client in Admin → Pricing, Reviews & FAQ.', photo: '', rating: '5', source: 'Google' },
        { names: 'Sample Couple B', event: 'Engagement · Victoria Park, Kitchener', quote: 'Sample review text showing how a longer review wraps across several lines inside the card on desktop and mobile.', photo: '', rating: '5', source: 'Google' },
        { names: 'Sample Client C', event: 'Family Session · Waterloo Park', quote: 'Sample review text.', photo: '', rating: '5', source: '' }
    ],
    stories: [
        { couple: 'Sample Couple A', venue: 'Sample Venue', city: 'Cambridge', date: 'Sept 2026', cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000', summary: 'A short sample story: how the day felt, a favourite moment, and the light at golden hour.', album: 'weddings' },
        { couple: 'Sample Couple B', venue: 'Sample Venue', city: 'Kitchener', date: 'June 2026', cover: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000', summary: 'Another sample story to preview how two cards sit side by side.', album: '' }
    ]
};

// ==========================================================================
// Text from the admin panel, remembered in the browser
// The page HTML ships with default wording; saved settings arrive a moment
// later from the server. Re-applying the last-seen settings straight away
// stops returning visitors from seeing the wording change after load.
// ==========================================================================
const TEXT_CACHE_KEY = 'nv_text_v1';
const CACHED_TEXT_FIELDS = {
    heroSubtitle: 'heroSubtitle', heroDesc: 'heroDesc',
    aboutSubtitle: 'aboutSubtitle', aboutTitle: 'aboutTitle', aboutDesc1: 'aboutDesc1', aboutDesc2: 'aboutDesc2',
    photographerName: 'photographerNameDisplay', photographerRole: 'photographerRoleDisplay', photographerBio: 'photographerBioDisplay'
};

function applyTextSettings(settings) {
    Object.entries(CACHED_TEXT_FIELDS).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el && settings[key] && el.textContent !== settings[key]) el.textContent = settings[key];
    });
    if (settings.heroTitle) {
        const [line1, line2] = settings.heroTitle.includes('|')
            ? settings.heroTitle.split('|', 2).map(t => t.trim())
            : [settings.heroTitle.split(' ')[0], settings.heroTitle.split(' ').slice(1).join(' ')];
        const el = document.getElementById('heroTitle');
        const html = line2 ? `${escapeHtml(line1)} <span>${escapeHtml(line2)}</span>` : `<span>${escapeHtml(line1)}</span>`;
        if (el && el.innerHTML !== html) el.innerHTML = html;
    }
}

function rememberTextSettings(settings) {
    try {
        const keep = {};
        [...Object.keys(CACHED_TEXT_FIELDS), 'heroTitle'].forEach(k => { if (settings[k]) keep[k] = settings[k]; });
        localStorage.setItem(TEXT_CACHE_KEY, JSON.stringify(keep));
    } catch (e) { /* storage unavailable */ }
}

// Runs as soon as this script loads (before the server responds)
try {
    const cachedText = JSON.parse(localStorage.getItem(TEXT_CACHE_KEY) || 'null');
    if (cachedText && !DEMO_MODE) applyTextSettings(cachedText);
} catch (e) { /* ignore */ }

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
    state.albums = DEMO_MODE ? [...SAMPLE_ALBUMS] : [];
    state.photos = DEMO_MODE ? [...SAMPLE_PHOTOS] : [];
    state.instagramPosts = DEMO_MODE ? [...SAMPLE_INSTAGRAM] : [];
    state.settings = { ...DEFAULT_SETTINGS };
    applyDemoContent();
}

function applyDemoContent() {
    if (!DEMO_MODE) return;
    for (const [key, list] of Object.entries(DEMO_CONTENT)) {
        if (getContentList(key).length === 0) state.settings[key] = JSON.stringify(list);
    }
    const banner = document.getElementById('demoBanner');
    if (banner) banner.hidden = false;
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Bind event listeners immediately so the UI is responsive even if DB connection fails
    setupGlobalEventListeners();

    // Photo carousel + hero slider load in parallel (no database needed)
    loadPhotoCarousel();

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

    // Use DB content; sample data only appears in preview mode (?demo)
    const pick = (rows, samples) => (Array.isArray(rows) && rows.length > 0) ? rows : (DEMO_MODE ? [...samples] : []);
    state.albums         = pick(dbAlbums, SAMPLE_ALBUMS);
    state.photos         = pick(dbPhotos, SAMPLE_PHOTOS);
    state.instagramPosts = pick(dbInsta, SAMPLE_INSTAGRAM);

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
    applyDemoContent();
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
        schema.description = state.settings.siteDesc;
        schemaEl.textContent = JSON.stringify(schema, null, 2);
    }

    // 2. Set Canonical URL
    const canonical = document.getElementById('canonicalUrl');
    if (canonical) {
        canonical.setAttribute('href', window.location.href.split('#')[0]);
    }

    // 3. Hero Layout Elements
    document.getElementById('heroSubtitle').textContent = state.settings.heroSubtitle;
    
    // Second line is emphasised: split at '|' if present, otherwise after the first word
    const titleVal = state.settings.heroTitle || DEFAULT_SETTINGS.heroTitle;
    let [titleLine1, titleLine2] = titleVal.includes('|')
        ? titleVal.split('|', 2).map(t => t.trim())
        : [titleVal.split(' ')[0], titleVal.split(' ').slice(1).join(' ')];
    document.getElementById('heroTitle').innerHTML = titleLine2
        ? `${escapeHtml(titleLine1)} <span>${escapeHtml(titleLine2)}</span>`
        : `<span>${escapeHtml(titleLine1)}</span>`;
    
    document.getElementById('heroDesc').textContent = state.settings.heroDesc;

    // Hero: the first slide ships in the HTML (fast first paint). A "Hero Background
    // Image" set in the admin panel takes its place.
    if (state.settings.heroImage) {
        const first = document.querySelectorAll('.hero-slide')[0];
        const firstFrame = document.querySelectorAll('.hero-frame-slide')[0];
        [first, firstFrame].forEach(img => {
            if (img && img.getAttribute('src') !== state.settings.heroImage) {
                img.removeAttribute('srcset');
                img.src = state.settings.heroImage;
            }
        });
    }

    if (!DEMO_MODE) rememberTextSettings(state.settings);

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

    loadAnalytics(state.settings.gaMeasurementId);

    // 6. Packages, stories, reviews & FAQ
    renderPackages();
    renderStories();
    renderTestimonials();
    renderFaqs();

    // 7. Contact Info Details
    const studioPhone = state.settings.studioPhone || DEFAULT_SETTINGS.studioPhone;
    const studioEmail = state.settings.studioEmail || DEFAULT_SETTINGS.studioEmail;
    const handle = state.settings.instaHandle || DEFAULT_SETTINGS.instaHandle;
    document.querySelectorAll('[data-contact="phone"]').forEach(el => {
        el.textContent = studioPhone;
        el.href = `tel:${studioPhone.replace(/[^\d+]/g, '')}`;
    });
    document.querySelectorAll('[data-contact="email"]').forEach(el => {
        el.textContent = studioEmail;
        el.href = `mailto:${studioEmail}`;
    });
    document.querySelectorAll('[data-contact="instagram"]').forEach(el => {
        el.textContent = handle;
        el.href = `https://instagram.com/${encodeURIComponent(handle.replace('@', ''))}`;
    });
    const contactAddressEl = document.getElementById('contactAddressDisplay');
    if (contactAddressEl) {
        const address = state.settings.studioAddress || DEFAULT_SETTINGS.studioAddress;
        contactAddressEl.textContent = address;
        contactAddressEl.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }

    // 8. Instagram Profile
    const instaHandle = state.settings.instaHandle || DEFAULT_SETTINGS.instaHandle;
    let instaAvatar = state.settings.instaAvatar || DEFAULT_SETTINGS.instaAvatar;
    // Only use it if it is an image (a profile page link would show as a broken image)
    if (instaAvatar === 'Assets/logo.png' || !/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(instaAvatar)) instaAvatar = 'Assets/logo-sm.png';
    document.getElementById('instaHandle').textContent = instaHandle;
    document.getElementById('instaAvatar').src = instaAvatar;
    document.getElementById('instaFollowBtn').href = `https://instagram.com/${instaHandle.replace('@', '')}`;

    // 9. Portfolio & Categories
    renderPortfolioNav();
    renderPortfolioGrid();
    refreshPortfolioCarousel();

    // 10. Instagram feed cards
    renderInstagramFeedGrid();

    // 11. WhatsApp Floating Button Link Hydration
    const whatsappFloat = document.getElementById('whatsappFloat');
    if (whatsappFloat) {
        const number = (state.settings.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber).replace(/\D/g, '');
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
    filtersContainer.innerHTML = '';
    [{ slug: 'all', name: 'All Work' }, ...state.albums].forEach(album => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `filter-btn ${activeSlug === album.slug ? 'active' : ''}`;
        btn.dataset.filter = album.slug;
        btn.setAttribute('aria-pressed', String(activeSlug === album.slug));
        btn.textContent = album.name;
        filtersContainer.appendChild(btn);
    });

    // Rebind filter buttons click listeners
    const buttons = filtersContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
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

    updateAlbumGridVisibility();
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
            state.filteredPhotos = photosToRender;
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
    const categoryLabel = photo.categoryLabel || (album ? album.name : 'Fine Art');

    // Set content
    resetLightboxZoom();
    lightboxImg.src = photo.url;
    lightboxImg.dataset.zoomSrc = photo.zoomUrl || '';
    lightboxImg.alt = photo.altText;
    lightboxTitle.textContent = photo.title;
    lightboxCategory.textContent = categoryLabel;

    // Show lightbox
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}


function closeLightbox() {
    resetLightboxZoom();
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

    // No posts yet: the section stays a slim band (profile + follow buttons)
    document.getElementById('instagram').classList.toggle('is-empty', posts.length === 0);
    if (posts.length === 0) return;

    posts.forEach(post => {
        const item = document.createElement('a');
        item.href = post.postUrl || `https://instagram.com/${state.settings.instaHandle.replace('@', '')}`;
        item.target = '_blank';
        item.rel = 'noopener noreferrer';
        item.className = 'instagram-item';
        item.setAttribute('aria-label', `View Instagram post: ${post.caption.substring(0, 30)}...`);

        item.innerHTML = `
            <img src="${escapeHtml(post.imgUrl)}" alt="${escapeHtml(post.caption)}" class="instagram-img" loading="lazy">
            <div class="instagram-hover">
                <p class="instagram-caption">${escapeHtml(post.caption)}</p>
            </div>
        `;

        grid.appendChild(item);
    });
}

// ==========================================================================
// Contact Form Submission Action
// ==========================================================================
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

function setFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = `form-status ${type || ''}`;
    formStatus.style.display = message ? 'block' : 'none';
}

// Event dates can't be in the past
const contactDateInput = document.getElementById('contactDate');
if (contactDateInput) {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    contactDateInput.min = today.toISOString().slice(0, 10);
}

function readEnquiry() {
    const val = id => document.getElementById(id).value.trim();
    return {
        name:        val('contactName'),
        email:       val('contactEmail'),
        phone:       val('contactPhone'),
        eventType:   val('contactEventType'),
        requirement: val('contactRequirement'),
        date:        val('contactDate'),
        message:     val('contactMessage')
    };
}

function enquiryLines(enquiry) {
    const lines = ['Hello North Vows! I would like to enquire about your photography services.', ''];
    if (enquiry.name)        lines.push(`Name: ${enquiry.name}`);
    if (enquiry.email)       lines.push(`Email: ${enquiry.email}`);
    if (enquiry.phone)       lines.push(`Phone: ${enquiry.phone}`);
    if (enquiry.eventType)   lines.push(`Event Type: ${enquiry.eventType}`);
    if (enquiry.requirement) lines.push(`Requirement: ${enquiry.requirement}`);
    if (enquiry.date)        lines.push(`Date of Event: ${enquiry.date}`);
    if (enquiry.message)     lines.push('', enquiry.message);
    return lines;
}

if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const enquiry = readEnquiry();
        if (enquiry.date && contactDateInput.min && enquiry.date < contactDateInput.min) {
            contactDateInput.setCustomValidity('Please choose a date from today onwards.');
            contactDateInput.reportValidity();
            contactDateInput.setCustomValidity('');
            return;
        }

        const number = (state.settings.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber).replace(/\D/g, '');
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(enquiryLines(enquiry).join('\n'))}`, '_blank', 'noopener,noreferrer');
        trackEvent('generate_lead', { method: 'whatsapp', event_type: enquiry.eventType || 'not set' });
        contactForm.reset();
        setFormStatus('WhatsApp opened with your enquiry. Press send there to reach us.', 'success');
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
    // Ignore stray spaces from copy-paste or phone keyboards (saved passcodes are always trimmed)
    const pass = adminPassword.value.trim();

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

            } else if (res.status >= 500 && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
                // Local preview without a database: fall through to preview mode below
                console.warn('[Admin Auth] No database on this local preview — using preview mode.');
            } else if (res.status === 500 || data.error) {
                // ⚠️ Server / database config error
                const msg = data.error || 'Unknown server error.';
                lockError.textContent = '⚠ Server error: ' + msg;
                console.error('[Admin Auth] Server error:', msg);

            } else {
                lockError.textContent = 'Unexpected response from server.';
            }
            if (!(res.status >= 500 && ['localhost', '127.0.0.1'].includes(window.location.hostname))) {
                return; // API handled it — stop here
            }
        }

        // Non-JSON response — PHP not running, fall through to offline check
        console.warn('[Admin Auth] API did not return JSON (Content-Type: "' + contentType + '"). Switching to offline mode.');
    } catch (err) {
        // Network / fetch error — fall through to offline check
        console.warn('[Admin Auth] Network error — switching to offline mode:', err);
    }

    // --- Offline fallback: only on a local preview, where the API is unavailable
    // and nothing can be saved. The real passcode is never shipped to the browser.
    const isLocalPreview = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
    if (isLocalPreview && pass.length > 0) {
        db.setPasscode(pass);
        isAdminUnlocked = true;
        lockError.textContent = '';
        adminLockscreen.classList.add('unlocked');
        refreshAdminViews();
        loadInstagramApiStatus();
        showToast('Preview mode: changes show on the page but are not saved to the database.');
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
    renderContentEditors();
    renderCarouselAdmin();
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
    const current = photoAlbumDropdown.value;
    photoAlbumDropdown.innerHTML = '';
    photoFilterAlbumDropdown.innerHTML = '<option value="all">Show All Albums</option>';

    // Portfolio categories (Photo_carousel folders) work as albums: photos go to the carousel
    const folders = carouselState.folderCategories;
    if (folders.length) {
        const group = document.createElement('optgroup');
        group.label = 'Portfolio albums';
        folders.forEach(c => {
            const opt = document.createElement('option');
            opt.value = 'folder:' + (c.photos[0]?.folder || c.name);
            opt.textContent = `${c.name} (${c.photos.length})`;
            group.appendChild(opt);
        });
        photoAlbumDropdown.appendChild(group);
    }

    if (state.albums.length) {
        const group = document.createElement('optgroup');
        group.label = 'Other albums';
        state.albums.forEach(album => {
            const opt1 = document.createElement('option');
            opt1.value = album.id;
            opt1.textContent = album.name;
            group.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = album.id;
            opt2.textContent = album.name;
            photoFilterAlbumDropdown.appendChild(opt2);
        });
        photoAlbumDropdown.appendChild(group);
    }
    if ([...photoAlbumDropdown.options].some(o => o.value === current)) photoAlbumDropdown.value = current;
    updatePhotoFormForAlbum();

    photoFilterAlbumDropdown.onchange = () => renderAdminPhotosTable();
    photoAlbumDropdown.onchange = updatePhotoFormForAlbum;
}

// Portfolio albums only need the photo file; title / alt text / URL apply to other albums
function updatePhotoFormForAlbum() {
    const isFolder = photoAlbumDropdown.value.startsWith('folder:');
    [photoTitleInput, photoAltInput].forEach(el => { el.required = !isFolder; });
    photoTitleInput.placeholder = isFolder ? 'Optional for portfolio albums' : 'e.g. Silhouette at Sunset';
    photoAltInput.placeholder = isFolder ? 'Optional for portfolio albums' : 'Describe the image content for screen readers...';
    photoUrlInput.disabled = isFolder;
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

async function handleUploadedPhotoFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', true);
        return;
    }

    loadedFile = await compressImage(file); // resized for the web — sent as multipart on submit

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

        // Portfolio album → upload into the Photo_carousel category folder
        if (albumId.startsWith('folder:')) {
            if (!loadedFile) { showToast('Please choose a photo file to upload.', true); return; }
            const category = albumId.slice('folder:'.length);
            const ok = await uploadToCarousel(category, [loadedFile]);
            if (ok) {
                addPhotoForm.reset();
                loadedFile = null;
                uploadPreview.style.display = 'none';
                uploadPreview.src = '';
                updatePhotoFormForAlbum();
            }
            return;
        }
        if (!albumId) { showToast('Please create an album first.', true); return; }

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
const newInstaPostUrl = document.getElementById('newInstaPostUrl');

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
            <td>${post.postUrl ? `<a href="${escapeHtml(post.postUrl)}" target="_blank" rel="noopener noreferrer" class="text-accent">Open</a>` : '—'}</td>
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
        const postUrl = newInstaPostUrl.value.trim();

        const newPost = {
            id: 'insta-' + Date.now(),
            imgUrl,
            caption,
            likes: 0,
            postUrl: postUrl || `https://instagram.com/${state.settings.instaHandle.replace('@', '')}`,
            createdAt: Date.now()
        };

        await db.saveInstagramPost(newPost);
        state.instagramPosts = await db.getInstagramPosts();
        
        instaAddPostForm.reset();
        
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
    document.getElementById('settingStudioEmail').value = state.settings.studioEmail || DEFAULT_SETTINGS.studioEmail;
    document.getElementById('settingGaMeasurementId').value = state.settings.gaMeasurementId || '';
    document.getElementById('settingHeroSlideSeconds').value = state.settings.heroSlideSeconds || DEFAULT_SETTINGS.heroSlideSeconds;

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
            'studioPhone', 'studioAddress', 'studioEmail',
            'whatsappNumber', 'whatsappMessage', 'gaMeasurementId',
            'heroImage', 'heroSlideSeconds'
        ];

        for (const field of fields) {
            const val = document.getElementById(`setting${field.charAt(0).toUpperCase() + field.slice(1)}`).value.trim();
            await db.saveSetting(field, val);
            state.settings[field] = val;
        }

        hydrateSiteUI();
        restartHeroTimer(); // apply a new slider speed straight away
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
    const links = navLinks.querySelectorAll('a[href^="#"]');
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
    if (adminTrigger) adminTrigger.addEventListener('click', openAdminPanel);
    const openAdminFromHash = () => {
        if (window.location.hash === '#admin') {
            openAdminPanel();
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    };
    window.addEventListener('hashchange', openAdminFromHash);
    openAdminFromHash();
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

    // Lightbox swipe gestures: see bindLightboxSwipe() (zoom-aware)
}

// ==========================================================================
// Packages, Wedding Stories, Testimonials & FAQ
// Each list is stored as a JSON string in nv_settings (no extra DB tables).
// ==========================================================================
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function getContentList(key) {
    try {
        const list = JSON.parse(state.settings[key] || '[]');
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

// Shows a section (and its nav link) only when it has content
function toggleSection(sectionId, visible) {
    const section = document.getElementById(sectionId);
    if (section) section.hidden = !visible;
    document.querySelectorAll(`[data-nav-for="${sectionId}"]`).forEach(li => { li.hidden = !visible; });
}

function linesToList(text) {
    return String(text || '').split('\n').map(l => l.trim()).filter(Boolean);
}

function renderPackages() {
    const grid = document.getElementById('packagesGrid');
    if (!grid) return;
    const packages = getContentList('packages');

    const planCards = packages.map((pkg, index) => {
        const priceHtml = pkg.price
            ? `${pkg.priceNote ? `<span class="package-price-note">${escapeHtml(pkg.priceNote)}</span>` : ''}
               <span class="package-amount">$${escapeHtml(pkg.price)}</span><span class="package-currency">CAD</span>`
            : `<span class="package-amount package-amount-text">Custom quote</span>`;
        const highlights = [pkg.hours, pkg.photos].filter(Boolean)
            .map(h => `<li>${escapeHtml(h)}</li>`).join('');
        const includes = linesToList(pkg.includes).map(i => `<li>${escapeHtml(i)}</li>`).join('');

        return `
            <article class="package-card ${pkg.featured ? 'featured' : ''}">
                ${pkg.featured ? '<span class="package-badge">Signature</span>' : ''}
                <h3 class="package-name">${escapeHtml(pkg.name)}</h3>
                ${pkg.tagline ? `<p class="package-tagline">${escapeHtml(pkg.tagline)}</p>` : ''}
                <div class="package-price">${priceHtml}</div>
                ${highlights || includes ? `
                <button type="button" class="package-toggle" aria-expanded="false">What's included</button>
                <div class="package-details">
                    ${highlights ? `<ul class="package-highlights">${highlights}</ul>` : ''}
                    ${includes ? `<ul class="package-includes">${includes}</ul>` : ''}
                </div>` : ''}
                <a href="#contact" class="package-cta" data-package-index="${index}">${escapeHtml(pkg.ctaLabel || 'Check my date')}</a>
            </article>`;
    }).join('');

    // Always offered: a tailor-made package for every other kind of event
    const hasPlans = packages.length > 0;
    const tailoredCard = `
        <article class="package-card package-tailored">
            <div>
                <span class="package-price-note">${hasPlans ? 'Something else in mind?' : 'Made for you'}</span>
                <h3 class="package-name">Tailor-Made Packages</h3>
                <p class="package-tailored-text">${hasPlans
                    ? 'Pre-wedding shoots, intimate functions, graduations, prom, professional headshots, or something completely different. Tell us what you need and we will build a package and price around it.'
                    : 'Every celebration is different, so we do not sell one-size-fits-all packages. Tell us about your event and we will put together the package that fits your day and your budget.'}</p>
            </div>
            <div>
                <button type="button" class="package-toggle" aria-expanded="false">What we can tailor</button>
                <div class="package-details">
                    <ul class="package-includes">
                        <li>Coverage hours that match your schedule</li>
                        <li>Photography, videography, or both</li>
                        <li>Locations across Kitchener, Waterloo, Cambridge and beyond</li>
                        <li>A clear quote before you book, with no hidden extras</li>
                    </ul>
                </div>
                <a href="#contact" class="package-cta" id="tailoredPackageCta">Get a custom quote</a>
            </div>
        </article>`;

    grid.style.setProperty('--plan-cols', Math.min(Math.max(packages.length, 1), 3));
    grid.innerHTML = planCards + tailoredCard;

    grid.querySelectorAll('.package-toggle').forEach(btn => {
        btn.addEventListener('click', () => toggleDisclosure(btn, btn.closest('.package-card')));
    });
    grid.querySelectorAll('.package-cta[data-package-index]').forEach(btn => {
        btn.addEventListener('click', () => prefillEnquiry(packages[Number(btn.dataset.packageIndex)]));
    });
    document.getElementById('tailoredPackageCta').addEventListener('click', () => prefillEnquiry({
        name: 'tailor-made',
        message: "Hi! I'd like a tailor-made package for my event."
    }));
}

// Pre-fills the contact form from a package's "Check my date" button
function prefillEnquiry(pkg) {
    if (!pkg) return;
    trackEvent('select_package', { package_name: pkg.name });
    const eventSelect = document.getElementById('contactEventType');
    if (eventSelect && pkg.eventType) {
        const match = [...eventSelect.options].find(o => o.text === pkg.eventType);
        if (match) eventSelect.value = match.value || match.text;
    }
    const message = document.getElementById('contactMessage');
    if (message && !message.value.trim()) {
        message.value = pkg.message || `Hi! I'm interested in your ${pkg.name} package.`;
    }
    setTimeout(() => document.getElementById('contactName')?.focus({ preventScroll: true }), 600);
}

function renderStories() {
    const grid = document.getElementById('storiesGrid');
    if (!grid) return;
    const stories = getContentList('stories');
    toggleSection('stories', stories.length > 0);

    grid.innerHTML = stories.map((story, index) => {
        const meta = [story.venue, story.city, story.date].filter(Boolean).map(escapeHtml).join(' · ');
        const album = state.albums.find(a => a.slug === story.album);
        return `
            <article class="story-card">
                ${story.cover ? `<div class="story-cover"><img src="${escapeHtml(story.cover)}" alt="${escapeHtml(story.couple)}${story.venue ? ' at ' + escapeHtml(story.venue) : ''}" loading="lazy"></div>` : ''}
                <div class="story-body">
                    ${meta ? `<span class="story-meta">${meta}</span>` : ''}
                    <h3 class="story-title">${escapeHtml(story.couple)}</h3>
                    ${story.summary ? `<p class="story-summary">${escapeHtml(story.summary)}</p>` : ''}
                    ${album ? `<button type="button" class="story-link" data-album="${escapeHtml(album.slug)}">View the gallery &rarr;</button>` : ''}
                </div>
            </article>`;
    }).join('');

    grid.querySelectorAll('.story-link').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentFilter = btn.dataset.album;
            renderPortfolioNav();
            renderPortfolioGrid();
            const album = state.albums.find(a => a.slug === btn.dataset.album);
            const tab = album && carouselState.categories.find(c => c.albumIds?.includes(album.id));
            if (tab) {
                carouselState.active = tab.slug;
                refreshPortfolioCarousel();
            }
            document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function renderTestimonials() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;
    const reviews = getContentList('testimonials');
    toggleSection('reviews', reviews.length > 0);

    grid.innerHTML = reviews.map(review => {
        const rating = Math.max(0, Math.min(5, parseInt(review.rating, 10) || 0));
        const initials = String(review.names || '?').split(/\s|&/).filter(Boolean)
            .slice(0, 2).map(w => w[0].toUpperCase()).join('');
        return `
            <figure class="review-card">
                ${rating ? `<div class="review-stars" aria-label="${rating} out of 5 stars">${'★'.repeat(rating)}</div>` : ''}
                <blockquote class="review-quote">${escapeHtml(review.quote)}</blockquote>
                <figcaption class="review-author">
                    ${review.photo
                        ? `<img src="${escapeHtml(review.photo)}" alt="${escapeHtml(review.names)}" class="review-avatar" loading="lazy">`
                        : `<span class="review-avatar review-avatar-initials" aria-hidden="true">${escapeHtml(initials)}</span>`}
                    <span>
                        <strong class="review-names">${escapeHtml(review.names)}</strong>
                        ${review.event ? `<span class="review-event">${escapeHtml(review.event)}</span>` : ''}
                    </span>
                    ${review.source ? `<span class="review-source">via ${escapeHtml(review.source)}</span>` : ''}
                </figcaption>
            </figure>`;
    }).join('');

    renderReviewLinks();
}

// Google review links: "write" = leave a review, "read" = Google Maps listing.
// Buttons without a link stay hidden; the strip hides when neither is set.
function renderReviewLinks() {
    const links = {
        write: (state.settings.googleReviewsUrl || '').trim(),
        read: (state.settings.googleReadReviewsUrl || '').trim()
    };
    document.querySelectorAll('[data-review]').forEach(a => {
        const url = links[a.dataset.review];
        if (url) a.href = url;
        a.hidden = !url;
        if (a.parentElement.tagName === 'LI') a.parentElement.hidden = !url;
    });
    const any = Boolean(links.write || links.read);
    const strip = document.getElementById('reviewStrip');
    if (strip) strip.hidden = !any;
    const footer = document.getElementById('reviewsFooter');
    if (footer) footer.hidden = !any;
}

function renderFaqs() {
    const list = document.getElementById('faqList');
    if (!list) return;
    const faqs = getContentList('faqs');
    toggleSection('faq', faqs.length > 0);

    list.innerHTML = faqs.map(faq => `
        <details class="faq-item">
            <summary class="faq-question">${escapeHtml(faq.q)}</summary>
            <div class="faq-answer">${linesToList(faq.a).map(p => `<p>${escapeHtml(p)}</p>`).join('')}</div>
        </details>`).join('');

    // Accordion: opening one answer closes the others
    list.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('toggle', () => {
            if (!item.open) return;
            list.querySelectorAll('.faq-item[open]').forEach(other => { if (other !== item) other.open = false; });
        });
    });
    const faqToggleLabel = document.querySelector('#faqToggle span');
    if (faqToggleLabel && document.getElementById('faqToggle').getAttribute('aria-expanded') !== 'true') {
        faqToggleLabel.textContent = `Show questions (${faqs.length})`;
    }

    // FAQ structured data so Google can show the answers in search results
    const schemaEl = document.getElementById('faqSchema');
    if (schemaEl) {
        schemaEl.textContent = faqs.length ? JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a }
            }))
        }) : '';
    }
}

// --- ADMIN: generic list editors for the "Pricing, Reviews & FAQ" tab ---
const EVENT_TYPE_OPTIONS = ['', 'Wedding', 'Pre-wedding', 'Intimate Function', 'Couple Portrait', 'Family Session',
    'Solo Portrait', 'Graduation / Prom', 'Professional Headshot', 'Pet Session', 'Other'];

const CONTENT_EDITORS = [
    {
        key: 'packages',
        title: 'Packages & Pricing (CAD)',
        itemLabel: 'Package',
        hint: 'Starting-price plans. A "Tailor-Made Packages" card for all other events is always shown below them.',
        fields: [
            { name: 'name', label: 'Package Name', required: true, placeholder: 'e.g. Wedding Essentials' },
            { name: 'price', label: 'Price in CAD (leave blank for "Custom quote")', placeholder: 'e.g. 500' },
            { name: 'priceNote', label: 'Text Before Price', placeholder: 'e.g. Starting from' },
            { name: 'tagline', label: 'One-Line Description', placeholder: 'e.g. A short, relaxed shoot that fits into a busy week.' },
            { name: 'ctaLabel', label: 'Button Text', placeholder: 'e.g. Check my date' },
            { name: 'hours', label: 'Coverage / Duration', placeholder: 'e.g. Up to 3 hours of coverage' },
            { name: 'photos', label: 'Photos Delivered', placeholder: 'e.g. 150+ edited photos' },
            { name: 'eventType', label: 'Event Type Pre-selected in Contact Form', type: 'select', options: EVENT_TYPE_OPTIONS },
            { name: 'includes', label: "What's Included (one item per line)", type: 'textarea', full: true },
            { name: 'featured', label: 'Highlight as "Signature"', type: 'checkbox' }
        ],
        summary: item => [item.name, item.price ? `$${item.price} CAD` : 'Custom quote']
    },
    {
        key: 'testimonials',
        title: 'Client Reviews',
        itemLabel: 'Review',
        hint: 'Only add real reviews, with the client\'s permission. The Reviews section stays hidden until you add one.',
        fields: [
            { name: 'names', label: 'Client Name(s)', required: true, placeholder: 'e.g. Priya & Daniel' },
            { name: 'event', label: 'Event & Location', placeholder: 'e.g. Wedding · Langdon Hall, Cambridge' },
            { name: 'quote', label: 'Review Text', type: 'textarea', required: true, full: true },
            { name: 'photo', label: 'Client Photo (optional)', type: 'image' },
            { name: 'rating', label: 'Star Rating (1–5, blank to hide)', type: 'number', min: 1, max: 5, placeholder: '5' },
            { name: 'source', label: 'Review Source (optional)', placeholder: 'e.g. Google' }
        ],
        summary: item => [item.names, String(item.quote || '').slice(0, 60) + (String(item.quote || '').length > 60 ? '…' : '')]
    },
    {
        key: 'stories',
        title: 'Real Wedding Stories',
        itemLabel: 'Story',
        hint: 'Name the venue and city. Local venue names help couples find you on Google. Link an album to add a "View the gallery" button.',
        fields: [
            { name: 'couple', label: 'Couple', required: true, placeholder: 'e.g. Priya & Daniel' },
            { name: 'venue', label: 'Venue', placeholder: 'e.g. Langdon Hall' },
            { name: 'city', label: 'City', placeholder: 'e.g. Cambridge' },
            { name: 'date', label: 'Month / Year', placeholder: 'e.g. Sept 2026' },
            { name: 'cover', label: 'Cover Photo', type: 'image', required: true },
            { name: 'album', label: 'Linked Portfolio Album (optional)', type: 'album' },
            { name: 'summary', label: 'Short Story (2–3 sentences)', type: 'textarea', full: true }
        ],
        summary: item => [item.couple, [item.venue, item.city].filter(Boolean).join(', ')]
    },
    {
        key: 'faqs',
        title: 'Frequently Asked Questions',
        itemLabel: 'Question',
        fields: [
            { name: 'q', label: 'Question', required: true, full: true },
            { name: 'a', label: 'Answer (blank line = new paragraph)', type: 'textarea', required: true, full: true }
        ],
        summary: item => [item.q, String(item.a || '').slice(0, 60) + (String(item.a || '').length > 60 ? '…' : '')]
    }
];

const contentEditorState = {}; // key → index being edited (or null)

function renderContentEditors() {
    const container = document.getElementById('contentEditors');
    if (!container) return;
    container.innerHTML = '';
    CONTENT_EDITORS.forEach(config => container.appendChild(buildContentEditor(config)));

    const googleInput = document.getElementById('settingGoogleReviewsUrl');
    if (googleInput) googleInput.value = state.settings.googleReviewsUrl || '';
    const googleReadInput = document.getElementById('settingGoogleReadReviewsUrl');
    if (googleReadInput) googleReadInput.value = state.settings.googleReadReviewsUrl || '';
}

function buildContentFieldHtml(config, field) {
    const id = `ce-${config.key}-${field.name}`;
    const req = field.required ? 'required' : '';
    const ph = field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : '';
    let input;
    switch (field.type) {
        case 'textarea':
            input = `<textarea id="${id}" name="${field.name}" class="admin-textarea" ${req} ${ph}></textarea>`;
            break;
        case 'select':
            input = `<select id="${id}" name="${field.name}" class="admin-select">${field.options.map(o =>
                `<option value="${escapeHtml(o)}">${o ? escapeHtml(o) : 'None'}</option>`).join('')}</select>`;
            break;
        case 'album':
            input = `<select id="${id}" name="${field.name}" class="admin-select"><option value="">None</option>${state.albums.map(a =>
                `<option value="${escapeHtml(a.slug)}">${escapeHtml(a.name)}</option>`).join('')}</select>`;
            break;
        case 'checkbox':
            return `<div class="admin-flex-col ce-checkbox"><label for="${id}"><input type="checkbox" id="${id}" name="${field.name}"> ${escapeHtml(field.label)}</label></div>`;
        case 'image':
            input = `<div class="ce-image-row">
                        <input type="text" id="${id}" name="${field.name}" class="admin-input" ${req} placeholder="Image URL, or upload →">
                        <button type="button" class="admin-btn btn-outline ce-upload-btn" data-target="${id}">Upload</button>
                        <input type="file" accept="image/*" class="ce-upload-input" data-target="${id}" hidden>
                     </div>`;
            break;
        case 'number':
            input = `<input type="number" id="${id}" name="${field.name}" class="admin-input" min="${field.min}" max="${field.max}" ${req} ${ph}>`;
            break;
        default:
            input = `<input type="text" id="${id}" name="${field.name}" class="admin-input" ${req} ${ph}>`;
    }
    return `<div class="admin-flex-col ${field.full ? 'ce-full' : ''}"><label class="form-label" for="${id}">${escapeHtml(field.label)}</label>${input}</div>`;
}

function buildContentEditor(config) {
    const list = getContentList(config.key);
    const editingIndex = contentEditorState[config.key] ?? null;
    const card = document.createElement('div');
    card.className = 'admin-card ce-card';

    card.innerHTML = `
        <h3 style="margin-bottom:0.5rem; font-size:1.1rem; text-transform:uppercase; letter-spacing:0.05em;">${escapeHtml(config.title)}</h3>
        ${config.hint ? `<p style="font-size:0.8rem; color:var(--color-muted); margin-bottom:1rem; line-height:1.5;">${escapeHtml(config.hint)}</p>` : ''}
        <div class="admin-table-wrap" style="margin-bottom:1.5rem;">
            <table class="admin-table">
                <tbody>
                    ${list.length === 0
                        ? `<tr><td style="text-align:center; color:var(--color-muted); padding:1.5rem;">Nothing added yet. This section is hidden on the website.</td></tr>`
                        : list.map((item, i) => {
                            const [main, sub] = config.summary(item);
                            return `<tr ${i === editingIndex ? 'class="ce-editing"' : ''}>
                                <td><strong style="font-weight:500;">${escapeHtml(main)}</strong><br><span style="font-size:0.8rem; color:var(--color-muted);">${escapeHtml(sub || '')}</span></td>
                                <td style="width:1%; white-space:nowrap;"><div class="action-btns">
                                    <button type="button" class="action-btn" data-action="up" data-index="${i}" title="Move up" ${i === 0 ? 'disabled' : ''}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                                    </button>
                                    <button type="button" class="action-btn" data-action="down" data-index="${i}" title="Move down" ${i === list.length - 1 ? 'disabled' : ''}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                                    </button>
                                    <button type="button" class="action-btn" data-action="edit" data-index="${i}" title="Edit">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                                    </button>
                                    <button type="button" class="action-btn delete" data-action="delete" data-index="${i}" title="Delete">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div></td>
                            </tr>`;
                        }).join('')}
                </tbody>
            </table>
        </div>
        <form class="ce-form">
            <h4 class="ce-form-title">${editingIndex === null ? `Add ${escapeHtml(config.itemLabel)}` : `Edit ${escapeHtml(config.itemLabel)}`}</h4>
            <div class="admin-flex-row">${config.fields.map(f => buildContentFieldHtml(config, f)).join('')}</div>
            <div style="display:flex; gap:0.75rem;">
                <button type="submit" class="admin-btn">${editingIndex === null ? `Add ${escapeHtml(config.itemLabel)}` : 'Save Changes'}</button>
                ${editingIndex === null ? '' : '<button type="button" class="admin-btn btn-outline ce-cancel">Cancel</button>'}
            </div>
        </form>`;

    const form = card.querySelector('.ce-form');

    // Fill the form when editing an existing item
    if (editingIndex !== null && list[editingIndex]) {
        const item = list[editingIndex];
        config.fields.forEach(f => {
            const el = form.elements[f.name];
            if (!el) return;
            if (f.type === 'checkbox') el.checked = !!item[f.name];
            else el.value = item[f.name] ?? '';
        });
    }

    card.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const i = Number(btn.dataset.index);
            const items = getContentList(config.key);
            const action = btn.dataset.action;
            if (action === 'edit') {
                contentEditorState[config.key] = i;
                renderContentEditors();
                return;
            }
            if (action === 'delete') {
                if (!confirm(`Delete this ${config.itemLabel.toLowerCase()}?`)) return;
                items.splice(i, 1);
                contentEditorState[config.key] = null;
            } else {
                const j = action === 'up' ? i - 1 : i + 1;
                if (j < 0 || j >= items.length) return;
                [items[i], items[j]] = [items[j], items[i]];
            }
            await saveContentList(config.key, items);
        });
    });

    card.querySelector('.ce-cancel')?.addEventListener('click', () => {
        contentEditorState[config.key] = null;
        renderContentEditors();
    });

    card.querySelectorAll('.ce-upload-btn').forEach(btn => {
        const fileInput = card.querySelector(`.ce-upload-input[data-target="${btn.dataset.target}"]`);
        btn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            showToast('Uploading image…');
            try {
                const result = await db.uploadImage(file);
                if (result && result.url) {
                    document.getElementById(btn.dataset.target).value = result.url;
                    showToast('Image uploaded.');
                } else {
                    showToast('Upload failed: ' + (result?.error || 'Unknown error'), true);
                }
            } catch (err) {
                showToast('Upload needs the live server. Paste an image URL instead.', true);
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const item = {};
        config.fields.forEach(f => {
            const el = form.elements[f.name];
            item[f.name] = f.type === 'checkbox' ? el.checked : el.value.trim();
        });
        const items = getContentList(config.key);
        if (editingIndex === null) items.push(item);
        else items[editingIndex] = item;
        contentEditorState[config.key] = null;
        await saveContentList(config.key, items);
    });

    return card;
}

async function saveContentList(key, list) {
    state.settings[key] = JSON.stringify(list);
    renderContentEditors();
    hydrateSiteUI();
    try {
        const res = await db.saveSetting(key, state.settings[key]);
        if (res && res.error) throw new Error(res.error);
        showToast('Saved.');
    } catch (err) {
        showToast('Updated on this page only. Could not save to the database.', true);
    }
}

const googleReviewsForm = document.getElementById('googleReviewsForm');
if (googleReviewsForm) {
    googleReviewsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const writeUrl = document.getElementById('settingGoogleReviewsUrl').value.trim();
        const readUrl = document.getElementById('settingGoogleReadReviewsUrl').value.trim();
        state.settings.googleReviewsUrl = writeUrl;
        state.settings.googleReadReviewsUrl = readUrl;
        hydrateSiteUI();
        try {
            // A single space clears a link (empty values are ignored when settings load)
            for (const [key, value] of [['googleReviewsUrl', writeUrl], ['googleReadReviewsUrl', readUrl]]) {
                const res = await db.saveSetting(key, value || ' ');
                if (res && res.error) throw new Error(res.error);
            }
            showToast('Google review links saved.');
        } catch {
            showToast('Updated on this page only. Could not save to the database.', true);
        }
    });
}

// ==========================================================================
// Image compression for uploads
// Camera files are often 5–15 MB. Resize to a web-friendly size in the
// browser before uploading so the site stays fast.
// ==========================================================================
const UPLOAD_MAX_DIMENSION = 2400;
const UPLOAD_JPEG_QUALITY = 0.85;

async function compressImage(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, UPLOAD_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
        // Small enough already: keep the original (and PNG transparency)
        if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // JPEG has no transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', UPLOAD_JPEG_QUALITY));
        if (!blob || blob.size >= file.size) return file;
        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
        return new File([blob], name, { type: 'image/jpeg' });
    } catch (err) {
        console.warn('Image compression skipped:', err);
        return file;
    }
}

// ==========================================================================
// Service cards: on phones the name expands to show the description;
// on larger screens the whole card starts an enquiry.
// ==========================================================================
const phoneQuery = window.matchMedia('(max-width: 576px)');

function enquireAboutService(card) {
    const eventType = card.dataset.eventType;
    const select = document.getElementById('contactEventType');
    if (select) select.value = eventType;
    const serviceName = card.querySelector('.service-name')?.textContent.trim() || eventType;
    const message = document.getElementById('contactMessage');
    if (message && !message.value.trim()) message.value = `Hi! I'd like to ask about ${serviceName.toLowerCase()}.`;
    trackEvent('select_service', { event_type: eventType });
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('contactName')?.focus({ preventScroll: true }), 600);
}

// Expand/collapse helper shared by services and packages
function toggleDisclosure(button, container) {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    container.classList.toggle('is-open', open);
}

document.querySelectorAll('.service-card[data-event-type]').forEach(card => {
    const head = card.querySelector('.service-head');
    head.addEventListener('click', () => {
        if (phoneQuery.matches) toggleDisclosure(head, card);
        else enquireAboutService(card);
    });
    card.querySelector('.service-link').addEventListener('click', () => enquireAboutService(card));
});

// ==========================================================================
// Analytics (Google Analytics 4, optional)
// Set the Measurement ID in Admin → SEO & Settings. Nothing loads without it.
// ==========================================================================
let analyticsLoaded = false;

function loadAnalytics(measurementId) {
    if (analyticsLoaded || DEMO_MODE || !/^G-[A-Z0-9]+$/i.test(measurementId || '')) return;
    analyticsLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
}

function trackEvent(name, params = {}) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

// Clicks on phone, email, WhatsApp and booking buttons
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('tel:')) trackEvent('contact_click', { method: 'phone' });
    else if (href.startsWith('mailto:')) trackEvent('contact_click', { method: 'email' });
    else if (link.id === 'whatsappFloat') trackEvent('contact_click', { method: 'whatsapp_button' });
    else if (link.dataset.track) trackEvent('cta_click', { location: link.dataset.track });
    else if (link.dataset.social || link.id === 'instaFollowBtn') trackEvent('social_click', { network: link.dataset.social || 'instagram' });
});

// FAQ on phones: the question list is folded behind one button
const faqToggle = document.getElementById('faqToggle');
if (faqToggle) {
    faqToggle.addEventListener('click', () => {
        const wrap = faqToggle.closest('.faq-wrap');
        toggleDisclosure(faqToggle, wrap);
        const count = getContentList('faqs').length;
        faqToggle.querySelector('span').textContent = wrap.classList.contains('is-open') ? 'Hide questions' : `Show questions (${count})`;
    });
}

// ==========================================================================
// Photo carousel & hero slider
// Photos come from the Photo_carousel folder (one sub-folder per category),
// listed by api/carousel.php. Add a folder or photos and they appear here.
// ==========================================================================
const CAROUSEL_API = 'api/carousel.php';
const HERO_SLIDE_LIMIT = 8;
// Seconds each hero photo shows; set in Admin → SEO & Settings (1.5–15 s)
function heroSlideSeconds() {
    const v = parseFloat(state.settings.heroSlideSeconds || DEFAULT_SETTINGS.heroSlideSeconds);
    return Number.isFinite(v) ? Math.min(15, Math.max(1.5, v)) : 2;
}

// folderCategories: from Photo_carousel; categories: folders + admin albums combined
const carouselState = { folderCategories: [], categories: [], active: 'all', loaded: false };

async function loadPhotoCarousel() {
    try {
        const res = await fetch(`${CAROUSEL_API}?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) throw new Error('Carousel API unavailable');
        const data = await res.json();
        carouselState.folderCategories = (data.categories || []).filter(c => c.photos && c.photos.length);
    } catch (err) {
        console.warn('Photo carousel folder not loaded:', err.message);
        carouselState.folderCategories = [];
    }
    carouselState.loaded = true;
    refreshPortfolioCarousel();
    renderCarouselAdmin();
}

// Folder categories + albums added in the admin panel, as one list of tabs.
// An admin album with the same name as a folder joins that folder's tab.
function combinedCategories() {
    const cats = carouselState.folderCategories.map(c => ({ ...c, photos: [...c.photos], albumIds: [] }));
    state.albums.forEach(album => {
        const photos = state.photos
            .filter(p => p.albumId === album.id && p.url)
            .map(p => ({ large: p.url, thumb: p.url, alt: p.altText || `${album.name} by North Vows Photography`, width: null, height: null }));
        if (!photos.length) return;
        const existing = cats.find(c => c.name.toLowerCase() === album.name.trim().toLowerCase());
        if (existing) {
            existing.photos.push(...photos);
            existing.albumIds.push(album.id);
        } else {
            cats.push({ name: album.name, slug: `album-${album.slug}`, photos, albumIds: [album.id] });
        }
    });
    return cats;
}

function refreshPortfolioCarousel() {
    carouselState.categories = combinedCategories();
    const carousel = document.getElementById('photoCarousel');
    if (!carouselState.categories.length) {
        carousel.hidden = true;
        updateAlbumGridVisibility();
        return;
    }
    if (!carouselState.categories.some(c => c.slug === carouselState.active)) carouselState.active = 'all';
    renderCarouselTabs();
    renderCarouselTrack();
    buildHeroSlider();
    updateAlbumGridVisibility();
}

// "All" mixes the categories in turn (wedding, family, portrait, wedding, …)
// so visitors see the range of work straight away.
function interleave(lists) {
    const queues = lists.map(l => l.slice());
    const mixed = [];
    while (queues.some(q => q.length)) {
        queues.forEach(q => { if (q.length) mixed.push(q.shift()); });
    }
    return mixed;
}

function carouselPhotos(slug) {
    const withCategory = c => c.photos.map(p => ({ ...p, category: c.name }));
    if (slug === 'all') return interleave(carouselState.categories.map(withCategory));
    const cat = carouselState.categories.find(c => c.slug === slug);
    return cat ? withCategory(cat) : [];
}

function renderCarouselTabs() {
    const tabs = document.getElementById('carouselTabs');
    const cats = carouselState.categories;
    // One category needs no tabs; show them once there are two or more
    tabs.hidden = cats.length < 2;
    tabs.innerHTML = '';
    [{ slug: 'all', name: 'All' }, ...cats].forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-btn' + (cat.slug === carouselState.active ? ' active' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', String(cat.slug === carouselState.active));
        btn.textContent = cat.name;
        btn.addEventListener('click', () => {
            carouselState.active = cat.slug;
            renderCarouselTabs();
            renderCarouselTrack();
            trackEvent('carousel_category', { category: cat.name });
        });
        tabs.appendChild(btn);
    });
    document.getElementById('photoCarousel').hidden = false;
}

function renderCarouselTrack() {
    const track = document.getElementById('carouselTrack');
    const photos = carouselPhotos(carouselState.active);
    track.innerHTML = photos.map((p, i) => `
        <button type="button" class="carousel-item" data-index="${i}" aria-label="Open photo ${i + 1} of ${photos.length}: ${escapeHtml(p.category)}">
            <img data-src="${escapeHtml(p.thumb)}" ${p.medium ? `data-srcset="${escapeHtml(p.thumb)} 640w, ${escapeHtml(p.medium)} 1000w" sizes="(min-width: 993px) 31vw, (min-width: 577px) 40vw, 78vw"` : ''}
                 alt="${escapeHtml(p.alt)}" decoding="async"
                 ${p.width && p.height ? `width="${p.width}" height="${p.height}"` : ''}>
        </button>`).join('');
    track.scrollLeft = 0;
    observeCarouselImages(track);

    track.querySelectorAll('.carousel-item').forEach(item => {
        item.addEventListener('click', () => {
            state.filteredPhotos = photos.map((p, i) => ({
                url: p.large,
                zoomUrl: p.folder && p.file ? `Photo_carousel/${encodeURIComponent(p.folder)}/${encodeURIComponent(p.file)}` : '',
                altText: p.alt,
                title: p.category,
                categoryLabel: `${i + 1} / ${photos.length}`
            }));
            openLightbox(Number(item.dataset.index));
        });
    });
    updateCarouselControls();
}

// Load carousel photos only when they come near the screen (vertically or by
// scrolling the carousel); the browser's own lazy loading starts far too early on phones.
const carouselImageObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            loadDeferredImage(entry.target);
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '300px 400px' })
    : null;

function loadDeferredImage(img) {
    if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
    if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
}

function observeCarouselImages(track) {
    track.querySelectorAll('img[data-src]').forEach(img => {
        if (carouselImageObserver) carouselImageObserver.observe(img);
        else loadDeferredImage(img);
    });
}

function updateCarouselControls() {
    const track = document.getElementById('carouselTrack');
    const max = track.scrollWidth - track.clientWidth;
    document.getElementById('carouselPrev').disabled = track.scrollLeft <= 2;
    document.getElementById('carouselNext').disabled = track.scrollLeft >= max - 2;
    const progress = document.getElementById('carouselProgress');
    const visible = track.scrollWidth ? track.clientWidth / track.scrollWidth : 1;
    progress.style.width = `${Math.min(100, visible * 100)}%`;
    progress.style.transform = `translateX(${max > 0 ? (track.scrollLeft / max) * ((1 - visible) / visible) * 100 : 0}%)`;
    document.querySelector('.carousel-viewport').classList.toggle('no-scroll', max <= 2);
}

(function bindCarouselControls() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    const step = () => Math.max(track.clientWidth * 0.85, 240);
    document.getElementById('carouselPrev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    document.getElementById('carouselNext').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', () => window.requestAnimationFrame(updateCarouselControls), { passive: true });
    window.addEventListener('resize', updateCarouselControls);
    track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
})();

// The old album grid is only a fallback: admin albums now appear as carousel tabs
function updateAlbumGridVisibility() {
    const hide = carouselState.categories.length > 0 || state.photos.length === 0;
    document.getElementById('galleryFilters').hidden = hide;
    document.getElementById('galleryGrid').hidden = hide;
}

// --- Hero slider: a mix of categories, crossfading every few seconds ---
let heroTimer = null;
let heroIndex = 0;

let heroSlideKey = '';

function pickHeroSlides() {
    // Round-robin across categories so every category is represented
    return interleave(carouselState.categories.map(c => c.photos.map(p => ({ ...p, categoryName: c.name, categorySlug: c.slug }))))
        .slice(0, HERO_SLIDE_LIMIT);
}

function heroSrcset(p) {
    return p.medium ? `${p.thumb} 640w, ${p.medium} 1000w, ${p.large} 1600w` : '';
}

function buildHeroSlider() {
    const staticFrame = document.querySelector('.hero-frame-slide[data-source]');
    const staticSource = staticFrame ? staticFrame.dataset.source : '';
    const slides = pickHeroSlides().filter(p => p.large !== staticSource).slice(0, HERO_SLIDE_LIMIT - 1);
    const key = slides.map(p => p.large).join('|');
    if (!slides.length || key === heroSlideKey) return;
    heroSlideKey = key;

    const bg = document.getElementById('heroSlides');
    const frame = document.getElementById('heroFrameSlides');
    // Drop slides added by an earlier build, keep the first (HTML) slide
    bg.querySelectorAll('.hero-slide:not(:first-child)').forEach(el => el.remove());
    frame.querySelectorAll('.hero-frame-slide:not(:first-child)').forEach(el => el.remove());
    // Photos load on demand (data-*), just before they are shown
    slides.forEach(p => {
        // Blurred backdrop: the small copy is plenty
        bg.insertAdjacentHTML('beforeend',
            `<img class="hero-slide" data-src="${escapeHtml(p.thumb || p.large)}" alt="" decoding="async">`);
        frame.insertAdjacentHTML('beforeend',
            `<img class="hero-frame-slide" data-category="${escapeHtml(p.categoryName || '')}" data-slug="${escapeHtml(p.categorySlug || '')}"
                  data-src="${escapeHtml(p.medium || p.large)}" data-srcset="${escapeHtml(heroSrcset(p))}"
                  sizes="(min-width: 993px) 560px, 92vw" alt="${escapeHtml(p.alt || '')}" decoding="async">`);
    });

    const total = slides.length + 1;
    const dots = document.getElementById('heroDots');
    dots.innerHTML = Array.from({ length: total }, (_, i) =>
        `<button type="button" class="hero-dot${i === heroIndex ? ' is-active' : ''}" aria-label="Show photo ${i + 1}"></button>`).join('');
    dots.querySelectorAll('.hero-dot').forEach((dot, i) => dot.addEventListener('click', () => { showHeroSlide(i); restartHeroTimer(); }));
    if (heroIndex >= total) heroIndex = 0;

    document.getElementById('heroFrame').hidden = false;
    document.getElementById('home').classList.add('has-slides');
    loadHeroSlide(1); // warm up the next photo
    restartHeroTimer();
}

function loadHeroSlide(i) {
    document.querySelectorAll(`.hero-slide:nth-child(${i + 1}), .hero-frame-slide:nth-child(${i + 1})`).forEach(img => {
        if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
        if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
    });
}

document.addEventListener('visibilitychange', restartHeroTimer);

function showHeroSlide(i) {
    heroIndex = i;
    loadHeroSlide(i);
    ['.hero-slide', '.hero-frame-slide', '.hero-dot'].forEach(sel => {
        document.querySelectorAll(sel).forEach((el, j) => el.classList.toggle('is-active', j === i));
    });
    // Fetch the following photo now so it is ready for the next crossfade
    const count = document.querySelectorAll('.hero-slide').length;
    if (count > 1) loadHeroSlide((i + 1) % count);
    updateHeroCaption();
}

// Album label on the hero photo ("Birthdays · View album →")
function updateHeroCaption() {
    const active = document.querySelectorAll('.hero-frame-slide')[heroIndex];
    const caption = document.getElementById('heroCaption');
    if (!active || !caption) return;
    const name = active.dataset.category || '';
    caption.hidden = !name;
    if (!name) return;
    document.getElementById('heroCaptionName').textContent = name;
    caption.dataset.slug = active.dataset.slug || '';
    caption.setAttribute('aria-label', `View the ${name} album`);
}

let heroPaused = false;

function restartHeroTimer() {
    clearInterval(heroTimer);
    const dots = document.getElementById('heroDots');
    if (dots) dots.classList.toggle('is-paused', heroPaused);
    if (heroPaused) return;
    const activeDot = dots && dots.querySelector('.hero-dot.is-active');
    if (activeDot) { activeDot.classList.remove('is-active'); void activeDot.offsetWidth; activeDot.classList.add('is-active'); }
    const count = document.querySelectorAll('.hero-slide').length;
    // A slow crossfade is fine with "reduce motion" on; only the zoom effect is switched off (CSS)
    if (count < 2 || document.hidden) return;
    const seconds = heroSlideSeconds();
    if (dots) dots.style.setProperty('--hero-slide-duration', `${seconds}s`);
    heroTimer = setInterval(() => {
        const next = (heroIndex + 1) % count;
        const nextImg = document.querySelectorAll('.hero-frame-slide')[next];
        // On a slow connection, wait for the next photo instead of fading to an empty frame
        if (nextImg && !(nextImg.complete && nextImg.naturalWidth)) { loadHeroSlide(next); return; }
        showHeroSlide(next);
        if (dots) { const d = dots.querySelector('.hero-dot.is-active'); if (d) { d.classList.remove('is-active'); void d.offsetWidth; d.classList.add('is-active'); } }
    }, seconds * 1000);
}

// --- Lightbox: swipe left/right on touch screens ---
(function bindLightboxSwipe() {
    const box = document.getElementById('lightbox');
    if (!box) return;
    let startX = null;
    box.addEventListener('touchstart', (e) => {
        startX = (e.touches.length === 1 && lightboxZoom.scale === 1) ? e.touches[0].clientX : null;
    }, { passive: true });
    box.addEventListener('touchend', (e) => {
        if (startX === null || lightboxZoom.scale !== 1 || lightboxZoom.justPinched) { startX = null; return; }
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) (dx < 0 ? showNextPhoto : showPrevPhoto)();
        startX = null;
    }, { passive: true });
})();

// About block on phones: the studio paragraphs sit behind "Read more"
const aboutMoreToggle = document.getElementById('aboutMoreToggle');
if (aboutMoreToggle) {
    aboutMoreToggle.addEventListener('click', () => {
        toggleDisclosure(aboutMoreToggle, aboutMoreToggle.closest('.about-copy'));
        aboutMoreToggle.textContent = aboutMoreToggle.getAttribute('aria-expanded') === 'true' ? 'Read less' : 'Read more';
    });
}

// Lock screen: show / hide the passcode while typing
const adminShowPass = document.getElementById('adminShowPass');
if (adminShowPass) {
    adminShowPass.addEventListener('click', () => {
        const show = adminPassword.type === 'password';
        adminPassword.type = show ? 'text' : 'password';
        adminShowPass.setAttribute('aria-pressed', String(show));
        adminShowPass.setAttribute('aria-label', show ? 'Hide passcode' : 'Show passcode');
        adminPassword.focus();
    });
}

// ==========================================================================
// Admin: Portfolio carousel folders — upload into a category, remove photos
// ==========================================================================
function renderCarouselAdmin() {
    if (typeof photoAlbumDropdown !== 'undefined' && photoAlbumDropdown) renderAdminPhotoDropdowns();
    const list = document.getElementById('carouselAdminList');
    const select = document.getElementById('carouselCategorySelect');
    if (!list || !select) return;
    const cats = carouselState.folderCategories;

    const current = select.value;
    select.innerHTML = cats.length
        ? cats.map(c => `<option value="${escapeHtml(c.photos[0]?.folder || c.name)}">${escapeHtml(c.name)} (${c.photos.length})</option>`).join('')
        : '<option value="">No albums yet — type a new one</option>';
    if ([...select.options].some(o => o.value === current)) select.value = current;

    if (!cats.length) {
        list.innerHTML = `<p style="color:var(--color-muted); font-size:0.85rem;">${carouselState.loaded ? 'No portfolio photos yet. Upload some above.' : 'Loading…'}</p>`;
        return;
    }
    list.innerHTML = cats.map(c => `
        <div class="carousel-admin-category">
            <div class="carousel-admin-head">
                <h4>${escapeHtml(c.name)} <span>${c.photos.length} photo${c.photos.length === 1 ? '' : 's'}</span></h4>
                <label class="admin-btn btn-outline carousel-admin-add">
                    + Add photos
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-folder="${escapeHtml(c.photos[0]?.folder || c.name)}">
                </label>
            </div>
            <div class="carousel-admin-grid">
                ${c.photos.map(p => `
                    <figure class="carousel-admin-item">
                        <img src="${escapeHtml(p.thumb)}" alt="" loading="lazy">
                        ${p.folder ? `<button type="button" class="carousel-admin-remove" data-folder="${escapeHtml(p.folder)}" data-file="${escapeHtml(p.file)}" title="Remove from website" aria-label="Remove this photo">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>` : ''}
                    </figure>`).join('')}
            </div>
        </div>`).join('');

    list.querySelectorAll('.carousel-admin-add input').forEach(input => {
        input.addEventListener('change', async () => {
            const files = [...input.files];
            if (!files.length) return;
            input.closest('label').classList.add('is-busy');
            await uploadToCarousel(input.dataset.folder, files);
        });
    });

    list.querySelectorAll('.carousel-admin-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Remove this photo from the website? (It is kept on the server in Photo_carousel/_removed.)')) return;
            btn.disabled = true;
            try {
                const res = await db.removeCarouselPhoto(btn.dataset.folder, btn.dataset.file);
                if (!res || !res.success) throw new Error(res?.error || 'Could not remove the photo.');
                showToast('Photo removed from the website.');
                await loadPhotoCarousel();
            } catch (err) {
                btn.disabled = false;
                showToast(err.message || 'Could not remove the photo.', true);
            }
        });
    });
}

// Upload photos into a portfolio album (Photo_carousel category). Returns true if all succeeded.
async function uploadToCarousel(category, files, statusEl = document.getElementById('carouselUploadStatus')) {
    let done = 0, failed = 0, lastError = '';
    for (const file of files) {
        if (statusEl) statusEl.textContent = `Uploading ${done + failed + 1} of ${files.length} to ${category.replace(/_/g, ' ')}…`;
        try {
            const fd = new FormData();
            fd.append('category', category);
            fd.append('file', await compressImage(file));
            const res = await db.uploadCarouselPhoto(fd);
            if (!res || !res.success) throw new Error(res?.error || 'Upload failed');
            done++;
        } catch (err) {
            failed++;
            lastError = err.message;
            console.warn('Portfolio upload failed:', file.name, err);
        }
    }
    const name = category.replace(/_/g, ' ');
    const message = failed
        ? `${done} uploaded, ${failed} failed${lastError ? ` (${lastError})` : ''}.`
        : `${done} photo${done === 1 ? '' : 's'} added to ${name}.`;
    if (statusEl) statusEl.textContent = message;
    showToast(message, failed > 0);
    await loadPhotoCarousel();
    return failed === 0;
}

const carouselUploadForm = document.getElementById('carouselUploadForm');
if (carouselUploadForm) {
    carouselUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = document.getElementById('carouselUploadBtn');
        const newName = document.getElementById('carouselNewCategory').value.trim();
        const category = newName || document.getElementById('carouselCategorySelect').value;
        const files = [...document.getElementById('carouselFiles').files];
        if (!category) { showToast('Choose an album or type a new one.', true); return; }
        if (!files.length) { showToast('Choose one or more photos.', true); return; }
        button.disabled = true;
        await uploadToCarousel(category, files);
        button.disabled = false;
        carouselUploadForm.reset();
    });
}

// ==========================================================================
// Lightbox zoom
// Desktop: click to zoom at that spot (click again to zoom out), mouse wheel,
// drag to look around. Phones: pinch or double-tap, drag to look around.
// Keyboard: + / - / 0. While zoomed, the full-quality photo is swapped in.
// ==========================================================================
const LIGHTBOX_MAX_ZOOM = 4;
const LIGHTBOX_CLICK_ZOOM = 2.5;
const lightboxZoom = { scale: 1, x: 0, y: 0, pointers: new Map(), pinchDist: 0, drag: null, moved: false, lastTap: 0, justPinched: false };
const lightboxZoomBtn = document.getElementById('lightboxZoom');
const lightboxHint = document.getElementById('lightboxHint');
if (lightboxHint && window.matchMedia('(pointer: coarse)').matches) lightboxHint.textContent = 'Pinch or double-tap to zoom';

function applyLightboxZoom() {
    const z = lightboxZoom;
    z.scale = Math.min(LIGHTBOX_MAX_ZOOM, Math.max(1, z.scale));
    if (z.scale === 1) { z.x = 0; z.y = 0; }
    // Keep the photo covering its frame: no panning past its edges
    const maxX = (lightboxImg.offsetWidth * (z.scale - 1)) / 2;
    const maxY = (lightboxImg.offsetHeight * (z.scale - 1)) / 2;
    z.x = Math.min(maxX, Math.max(-maxX, z.x));
    z.y = Math.min(maxY, Math.max(-maxY, z.y));
    lightboxImg.style.transform = z.scale === 1 ? '' : `translate(${z.x}px, ${z.y}px) scale(${z.scale})`;
    const zoomed = z.scale > 1;
    lightbox.classList.toggle('is-zoomed', zoomed);
    if (lightboxZoomBtn) {
        lightboxZoomBtn.setAttribute('aria-pressed', String(zoomed));
        lightboxZoomBtn.setAttribute('aria-label', zoomed ? 'Zoom out' : 'Zoom in');
    }
    // Sharper photo while zoomed in
    if (zoomed && lightboxImg.dataset.zoomSrc && lightboxImg.getAttribute('src') !== lightboxImg.dataset.zoomSrc) {
        const hiRes = new Image();
        const target = lightboxImg.dataset.zoomSrc;
        hiRes.onload = () => { if (lightboxImg.dataset.zoomSrc === target) lightboxImg.src = target; };
        hiRes.src = target;
    }
}

// Zoom to newScale keeping the point under (clientX, clientY) in place
function zoomLightboxAt(newScale, clientX, clientY) {
    const z = lightboxZoom;
    const rect = lightboxImg.getBoundingClientRect();
    const cx = clientX ?? rect.left + rect.width / 2;
    const cy = clientY ?? rect.top + rect.height / 2;
    const target = Math.min(LIGHTBOX_MAX_ZOOM, Math.max(1, newScale));
    const px = cx - (rect.left + rect.width / 2);
    const py = cy - (rect.top + rect.height / 2);
    z.x += px * (1 - target / z.scale);
    z.y += py * (1 - target / z.scale);
    z.scale = target;
    applyLightboxZoom();
}

function resetLightboxZoom() {
    Object.assign(lightboxZoom, { scale: 1, x: 0, y: 0, drag: null, moved: false });
    lightboxZoom.pointers.clear();
    lightboxImg.classList.remove('is-dragging');
    applyLightboxZoom();
}

function toggleLightboxZoom(clientX, clientY) {
    if (lightboxZoom.scale > 1) resetLightboxZoom();
    else zoomLightboxAt(LIGHTBOX_CLICK_ZOOM, clientX, clientY);
}

(function bindLightboxZoom() {
    if (!lightboxImg) return;
    const z = lightboxZoom;
    const dist = () => { const [a, b] = [...z.pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    const mid = () => { const [a, b] = [...z.pointers.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };

    lightboxImg.addEventListener('dragstart', e => e.preventDefault());
    lightboxImg.addEventListener('pointerdown', (e) => {
        lightboxImg.setPointerCapture(e.pointerId);
        z.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (z.pointers.size === 2) {
            z.pinchDist = dist();
            z.drag = null;
            z.justPinched = true;
        } else if (z.pointers.size === 1) {
            z.drag = { x: e.clientX, y: e.clientY, ox: z.x, oy: z.y };
            z.moved = false;
        }
        lightboxImg.classList.add('is-dragging');
    });
    lightboxImg.addEventListener('pointermove', (e) => {
        if (!z.pointers.has(e.pointerId)) return;
        z.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (z.pointers.size === 2) {
            const d = dist();
            const m = mid();
            if (z.pinchDist) zoomLightboxAt(z.scale * (d / z.pinchDist), m.x, m.y);
            z.pinchDist = d;
        } else if (z.drag) {
            const dx = e.clientX - z.drag.x, dy = e.clientY - z.drag.y;
            if (Math.abs(dx) + Math.abs(dy) > 6) z.moved = true;
            if (z.scale > 1) {
                z.x = z.drag.ox + dx;
                z.y = z.drag.oy + dy;
                applyLightboxZoom();
            }
        }
    });
    const end = (e) => {
        const wasTap = z.pointers.size === 1 && !z.moved && !z.justPinched;
        z.pointers.delete(e.pointerId);
        if (z.pointers.size === 0) {
            lightboxImg.classList.remove('is-dragging');
            z.drag = null;
            if (wasTap && e.type === 'pointerup') {
                if (e.pointerType === 'mouse') {
                    toggleLightboxZoom(e.clientX, e.clientY);
                } else {
                    // Touch: double-tap to zoom (a single tap keeps swiping free)
                    const now = Date.now();
                    if (now - z.lastTap < 320) { toggleLightboxZoom(e.clientX, e.clientY); z.lastTap = 0; }
                    else z.lastTap = now;
                }
            }
            setTimeout(() => { z.justPinched = false; }, 50);
        } else if (z.pointers.size === 1) {
            // Pinch ended with one finger still down: continue as a drag from here
            const [p] = [...z.pointers.values()];
            z.drag = { x: p.x, y: p.y, ox: z.x, oy: z.y };
            z.pinchDist = 0;
        }
    };
    lightboxImg.addEventListener('pointerup', end);
    lightboxImg.addEventListener('pointercancel', end);

    // Mouse wheel / trackpad
    lightbox.addEventListener('wheel', (e) => {
        if (!lightbox.classList.contains('active')) return;
        e.preventDefault();
        zoomLightboxAt(z.scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY);
    }, { passive: false });

    if (lightboxZoomBtn) lightboxZoomBtn.addEventListener('click', () => toggleLightboxZoom());

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === '+' || e.key === '=') zoomLightboxAt(z.scale * 1.4);
        if (e.key === '-' || e.key === '_') zoomLightboxAt(z.scale / 1.4);
        if (e.key === '0') resetLightboxZoom();
    });
    window.addEventListener('resize', () => { if (z.scale > 1) applyLightboxZoom(); });
})();

// ==========================================================================
// Hero: light interactive touches (no libraries, transform/opacity only)
//  - soft gold glow follows the pointer, photo frame tilts slightly (desktop)
//  - album label on the photo opens that album in the Portfolio
//  - rotation pauses while the pointer is over the photo
// ==========================================================================
(function heroInteractions() {
    const hero = document.getElementById('home');
    const frame = document.getElementById('heroFrame');
    const caption = document.getElementById('heroCaption');
    if (!hero || !frame) return;

    caption?.addEventListener('click', () => {
        const slug = caption.dataset.slug;
        if (slug && carouselState.categories.some(c => c.slug === slug)) {
            carouselState.active = slug;
            refreshPortfolioCarousel();
        }
        trackEvent('hero_album_click', { album: slug || '' });
    });

    frame.addEventListener('pointerenter', () => { heroPaused = true; restartHeroTimer(); });
    frame.addEventListener('pointerleave', () => { heroPaused = false; restartHeroTimer(); });

    const fancyPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fancyPointer) return;

    let frameRequest = null, px = 0.5, py = 0.5;
    hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width;
        py = (e.clientY - r.top) / r.height;
        if (frameRequest) return;
        frameRequest = requestAnimationFrame(() => {
            frameRequest = null;
            const r2 = hero.getBoundingClientRect();
            hero.style.setProperty('--glow-x', `${Math.round(px * r2.width)}px`);
            hero.style.setProperty('--glow-y', `${Math.round(py * r2.height)}px`);
            hero.style.setProperty('--tilt-x', `${((0.5 - py) * 5).toFixed(2)}deg`);
            hero.style.setProperty('--tilt-y', `${((px - 0.5) * 7).toFixed(2)}deg`);
            hero.classList.add('is-pointing');
        });
    });
    hero.addEventListener('pointerleave', () => {
        hero.classList.remove('is-pointing');
        hero.style.setProperty('--tilt-x', '0deg');
        hero.style.setProperty('--tilt-y', '0deg');
    });
})();
