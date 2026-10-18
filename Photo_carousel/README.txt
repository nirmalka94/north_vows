PHOTO CAROUSEL — how to add photos
===================================

Each folder here is a category on the website (tabs in the Portfolio carousel).
The same photos also rotate in the big photo slider at the top of the page.

  Add photos      → drop JPG/PNG/WEBP files into a category folder
  New category    → create a new folder, e.g. "Family" or "Engagement"
  Order           → files are shown in name order; to order categories,
                    start folder names with a number: "01 Wedding", "02 Family"
                    (the number is hidden on the website)
  Remove          → delete the file or folder

Upload the originals (full quality). The website makes smaller, faster copies
automatically in the "_web" folder the first time they are viewed.
Portrait photos (4:5, e.g. 1080 x 1350) look best.

After adding photos, compress them before uploading (originals are kept in
Photo_carousel_originals/, which is NOT uploaded):
    python3 tools/compress_carousel.py
