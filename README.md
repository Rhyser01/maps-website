# MAPS website

| File | Page |
|---|---|
| `index.html` | Landing page (choose Residential or Commercial) |
| `residential.html` | Residential services |
| `commercial.html` | Commercial services |
| `residential-projects.html` | Residential photo gallery |
| `commercial-projects.html` | Commercial photo gallery |
| `css/site.css` | Styles shared by every page |
| `js/site.js` | Builds the service cards, filters, slideshow and gallery |
| `data/residential-projects.json` | Residential services and their photos |
| `data/commercial-projects.json` | Commercial services and their photos |
| `cloudcannon.config.yml` | Sets up the services and photo editor in CloudCannon |

Images are loaded from the `photos/` and `uploads/` folders already in this repo.

## Services and photos

Each side has one file in `data/` (`residential-projects.json`, `commercial-projects.json`). It holds the list of services, and each service has a name, a short description and its own photos. The service cards, the commercial scope list, the Projects page filter buttons, the slideshow and the gallery are all built from it, and there's no limit on how many services or photos it can hold.

- **In CloudCannon:** open **Services & photos** and pick a side. You can add, rename, reorder or remove services there, and add photos inside each one.
- **Filters:** a service's filter button only shows on the Projects page once it has at least one photo.
- **Other photos:** photos that don't fit a service go under **Other photos**.

Photos around 1600 px wide (JPG or WebP, under about 500 KB) keep the site fast.
