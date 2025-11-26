// Header

const searchInput = document.getElementById('search-bar');
const headerSearch = document.querySelector('.nav_li > .nav_link:first-child');
const searchText = document.querySelector('.search-text');

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