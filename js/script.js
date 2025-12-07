import { products } from "./data/products.js";

// HEADER SECTION
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


// HEADER ON MOBILE RESOLUTIONS
const mobileSearchIcon = document.querySelector('.js-mobile-search-icon');
const mobileSearch = document.querySelector('.js-mobile-search');
const closeMobileSearch = document.querySelector('.js-close-mobile-search');
const mobileSearchInput = document.querySelector('.js-mobile-search-input');

mobileSearchIcon.addEventListener('click', () => {
    mobileSearch.classList.add('is-open');
    mobileSearchInput.classList.add('is-open');
    document.body.classList.add('no-scroll');
});

closeMobileSearch.addEventListener('click', () => {
    mobileSearch.classList.remove('is-open');
    mobileSearchInput.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
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

// MAIN SECTION
const featuredProducts = document.getElementById('js-featured-products');
const offerProducts = document.getElementById('js-offer-products');

products.forEach(product => {
    let generatedHtml = `
    <article class="featured">
        <div class="featured_image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="featured_info">
            <div class="featured-title">
                <h2>${product.name}</h2>
            </div>
            <div class="featured-price">
                <p>$${(product.price / 100).toFixed(2)}</p>
            </div>
            <div class="featured-stars">
                <p><i class="fas fa-star"></i> ${product.rating.stars} — ${product.rating.reviews} reviews</p>
                <select id="qty-${product.name}" class="quantity-selector" data-product="${product.name}">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                </select>
            </div>
            <div class="featured-buy">
                <button>Buy Now <span><i class="fas fa-credit-card"></i></span></button>
                <button class="add-to-cart-btn" id="${product.id}">Add To Cart <span><i class="fas fa-shopping-cart"></i></span></button>
            </div>
        </div>
    </article>
    `;
    if (product.label !== "offer"){
        featuredProducts.innerHTML += generatedHtml;
    } else {
        offerProducts.innerHTML += generatedHtml;
    }
})

    const addToCart = document.querySelectorAll('.add-to-cart-btn');
    const cartQuantity = document.getElementById('cart-icon');
    const select = document.querySelector('#qty-Travel\\ Backpack');
    const value = select.value;


    addToCart.forEach(button => {
        button.addEventListener('click', () => {
            
        })
    })
