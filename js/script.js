// Header

const searchTextWrapper = document.getElementById('search-text-wrapper');
const searchInput = document.getElementById('search-bar');
const headerSearch = document.querySelector('.nav_link:first-child');
const searchText = document.querySelector('.search-text');
const searchIcon = document.getElementById('search-icon');

searchTextWrapper.addEventListener('click', () => {
    searchInput.classList.toggle('search-input-toggled');
    searchText.classList.toggle('search-text-toggled');
    searchIcon.classList.toggle('search-icon-toggled')
})


// Mobile Header
const mobileSearchIcon = document.querySelector('.js-mobile-search-icon');
const mobileSearch = document.querySelector('.js-mobile-search');
const closeMobileSearch = document.querySelector('.js-close-mobile-search');
const mobileSearchInput = document.querySelector('.js-mobile-search-input');


mobileSearchIcon.addEventListener('click', () => {
    mobileSearch.classList.add('is-open');
    mobileSearchInput.classList.add('is-open');
});

closeMobileSearch.addEventListener('click', () => {
    mobileSearch.classList.remove('is-open');
    mobileSearchInput.classList.remove('is-open');
});

const mediaQuery = window.matchMedia("(min-width: 1090px)");

mediaQuery.addEventListener("change", () => {
    if (mediaQuery.matches) {
        if (mobileSearch.classList.contains("is-open")) {
            mobileSearch.classList.remove("is-open");
            mobileSearchInput.classList.remove("is-open");
        }
    }
});

// FEATURED PRODUCTS

// FEATURED PRODUCTS
const featuredProducts = document.getElementById('js-featured-products');

let featuredProductsHTML = `
<article class="featured">
    <div class="featured_image">
        <img src="./images/backpack (2).jpg" alt="backpack image">
    </div>
    <div class="featured_info">
        <div class="featured-title">
            <h2>Travel Backpack</h2>
        </div>
        <div class="featured-price">
            <p>$79.99</p>
        </div>
        <div class="featured-stars">
            <p><i class="fas fa-star"></i> 4.6/5 — 1,024 reviews</p>
        </div>
        <div class="featured-buy">
            <button>Buy Now <span><i class="fas fa-credit-card"></i></span></button>
            <button>Add To Cart <span><i class="fas fa-shopping-cart"></i></span></button>
        </div>
    </div>
</article>
<article class="featured">
    <div class="featured_image">
        <img src="./images/men-cozy-fleece-zip-up-hoodie-red.jpg" alt="men hoodie image">
    </div>
    <div class="featured_info">
        <div class="featured-title">
            <h2>Cozy Fleece Hoodie</h2>
        </div>
        <div class="featured-price">
            <p>$49.99</p>
        </div>
        <div class="featured-stars">
            <p><i class="fas fa-star"></i> 4.3/5 — 387 reviews</p>
        </div>
        <div class="featured-buy">
            <button>Buy Now <span><i class="fas fa-credit-card"></i></span></button>
            <button>Add To Cart <span><i class="fas fa-shopping-cart"></i></span></button>
        </div>
    </div>
</article>
<article class="featured js-featured-display-none">
    <div class="featured_image">
        <img src="./images/electric-glass-and-steel-hot-water-kettle.webp" alt="kettle image">
    </div>
    <div class="featured_info">
        <div class="featured-title">
            <h2>Smart Electric Kettle</h2>
        </div>
        <div class="featured-price">
            <p>$39.99</p>
        </div>
        <div class="featured-stars">
            <p><i class="fas fa-star"></i> 4.1/5 — 290 reviews</p>
        </div>
        <div class="featured-buy">
            <button>Buy Now <span><i class="fas fa-credit-card"></i></span></button>
            <button>Add To Cart <span><i class="fas fa-shopping-cart"></i></span></button>
        </div>
    </div>
</article>
<article class="featured">
    <div class="featured_image">
        <img src="./images/plain-hooded-fleece-sweatshirt-yellow (1).jpg" alt="yellow hoodie image">
    </div>
    <div class="featured_info">
        <div class="featured-title">
            <h2>Everyday Hoodie</h2>
        </div>
        <div class="featured-price">
            <p>$59.99</p>
        </div>
        <div class="featured-stars">
            <p><i class="fas fa-star"></i> 4.8/5 — 2,504 reviews</p>
        </div>
        <div class="featured-buy">
            <button>Buy Now <span><i class="fas fa-credit-card"></i></span></button>
            <button>Add To Cart <span><i class="fas fa-shopping-cart"></i></span></button>
        </div>
    </div>
</article>
`;

featuredProducts.innerHTML += featuredProductsHTML;
