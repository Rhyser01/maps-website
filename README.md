# MAPS website

| File | Page |
|---|---|
| `index.html` | Landing page (choose Residential or Commercial) |
| `residential.html` | Residential services |
| `commercial.html` | Commercial services |
| `residential-projects.html` | Residential photo gallery |
| `commercial-projects.html` | Commercial photo gallery |
| `css/site.css` | Styles shared by every page |
| `js/site.js` | Slideshow, gallery and photo enlarging |
| `data/residential-projects.json` | Residential slideshow and gallery photos |
| `data/commercial-projects.json` | Commercial slideshow and gallery photos |
| `cloudcannon.config.yml` | Sets up the photo editor in CloudCannon |

Images are loaded from the `photos/` and `uploads/` folders already in this repo.

## Adding project photos

Each side has one photo list. The slideshow and the Projects page both read from it, and there's no limit on how many photos it can hold.

- **In CloudCannon:** open **Project photos**, choose a gallery and click **Add Photo**. Upload the image, type a short caption, pick its **Service** (that sets which filter it shows under), and save.
- **Editing the file directly:** add a line like this to the list:
  `{ "src": "uploads/my-photo.jpg", "caption": "Deck build" },`

Photos around 1600 px wide (JPG or WebP, under about 500 KB) keep the site fast.
