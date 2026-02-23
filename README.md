# Voltix

An e-commerce storefront built with **React + Vite**.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

### Install dependencies

```bash
npm install
```

### Development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build

```bash
npm run build
```

The output will be in the `dist/` directory.

### Preview production build

```bash
npm run preview
```

## Routes

| Path | Page |
|------|------|
| `/` | Home (banner, featured products, special offers, locations) |
| `/signup` | Sign up / Account page |
| `/cart` | Shopping cart |

## Project Structure

```
├── public/
│   └── images/        # Static image assets
├── src/
│   ├── data/
│   │   └── products.js  # Product data
│   ├── pages/
│   │   ├── Home.jsx     # Main landing page
│   │   ├── Signup.jsx   # Sign up page
│   │   └── Cart.jsx     # Shopping cart page
│   ├── App.jsx          # Router setup
│   └── main.jsx         # React entry point
├── css/               # Global stylesheets
│   ├── style.css
│   ├── signup_voltix.css
│   └── cart.css
├── index.html         # Vite HTML entry point
└── vite.config.js
```
