import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { products } from '../data/products'

function ProductCard({ product, onAddToCart }) {
  const [qty, setQty] = useState('1')

  return (
    <article className="featured">
      <div className="featured_image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="featured_info">
        <div className="featured-title">
          <h2>{product.name}</h2>
        </div>
        <div className="featured-price">
          <p>${(product.price / 100).toFixed(2)}</p>
        </div>
        <div className="featured-stars">
          <p><i className="fas fa-star"></i> {product.rating.stars} — {product.rating.reviews} reviews</p>
          <select
            id={`qty-${product.name}`}
            className="quantity-selector"
            data-product={product.name}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          >
            {[1,2,3,4,5,6,7,8].map(n => (
              <option key={n} value={String(n)}>{n}</option>
            ))}
          </select>
        </div>
        <div className="featured-buy">
          <button>Buy Now <span><i className="fas fa-credit-card"></i></span></button>
          <button className="add-to-cart-btn" id={product.id} onClick={() => onAddToCart(qty)}>
            Add To Cart <span><i className="fas fa-shopping-cart"></i></span>
          </button>
        </div>
      </div>
    </article>
  )
}

function Home() {
  const [cartQuantity, setCartQuantity] = useState(0)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)

  const featuredProducts = products.filter(p => p.label !== 'offer')
  const offerProducts = products.filter(p => p.label === 'offer')

  function handleAddToCart(qty) {
    setCartQuantity(Number(qty))
  }

  // Close mobile search when viewport widens past 1090px
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1090px)')
    const handler = () => {
      if (mediaQuery.matches && mobileSearchOpen) {
        setMobileSearchOpen(false)
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [mobileSearchOpen])

  // Toggle body no-scroll when mobile search is open
  useEffect(() => {
    if (mobileSearchOpen) {
      document.body.classList.add('no-scroll')
    } else {
      document.body.classList.remove('no-scroll')
    }
    return () => document.body.classList.remove('no-scroll')
  }, [mobileSearchOpen])

  return (
    <div id="hero" className="wrapper">
      {/* Mobile search overlay */}
      <div className={`mobile-search js-mobile-search${mobileSearchOpen ? ' is-open' : ''}`}>
        <span className="mobile-search-close js-close-mobile-search" onClick={() => setMobileSearchOpen(false)}>
          <i className="fa-solid fa-x"></i>
        </span>
        <div className="mobile-search-bar">
          <input
            className={`mobile-search-input js-mobile-search-input${mobileSearchOpen ? ' is-open' : ''}`}
            placeholder="Search Your Item Here..."
            type="text"
            required
          />
          <span className="mobile-search-bar-icon"><i className="fas fa-search"></i></span>
        </div>
      </div>

      <header>
        <div>
          <h2 className="voltix_logo"><span>V</span>oltix</h2>
        </div>
        <div className="media-queries-header-icons">
          <span className="js-mobile-search-icon media-queries-search-icon" onClick={() => setMobileSearchOpen(true)}>
            <i className="fas fa-search"></i>
          </span>
          <a className="mobile-cart" href="#">
            <span className="mobile-cart-quantity">{cartQuantity}</span>
            <i className="fas fa-shopping-cart"></i>
          </a>
          <Link target="_blank" to="/signup" className="media-queries-user-icon">
            <i className="fas fa-user"></i>
          </Link>
        </div>
        <nav>
          <ul className="nav_ul">
            <li className="nav_li">
              <span className="nav_link">
                <span id="search-wrapper">
                  <input
                    id="search-bar"
                    type="text"
                    placeholder="Search Your Item Here..."
                    required
                    style={{ display: searchVisible ? 'block' : 'none' }}
                  />
                  <span id="search-text-wrapper" onClick={() => setSearchVisible(v => !v)}>
                    <i id="search-icon" className={`fas fa-search${searchVisible ? ' search-icon-toggled' : ''}`}></i>
                    <span className={`search-text${searchVisible ? ' search-text-toggled' : ''}`}> Search</span>
                  </span>
                </span>
              </span>
              <a href="#offers" className="nav_link"><i className="fas fa-tags"></i> Special Offers</a>
              <a href="#locations" className="nav_link"><i className="fas fa-map-marker-alt"></i> Locations</a>
              <a href="#" className="nav_link cart-icon">
                <i className="fas fa-shopping-cart"></i>
                <span className="cart-quantity">{cartQuantity}</span> Cart
              </a>
              <Link to="/signup" className="nav_link"><i className="fas fa-user"></i> Account</Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="banner_section">
          <div className="banner">
            <div className="banner-info">
              <h2>Amazing <span>VR</span> Experience</h2>
              <p>Step into the future of reality.</p>
              <a className="hero-link" href="#">Buy Now!!<span className="blue-span"></span></a>
            </div>
            <div className="banner-image">
              <img src="/images/realistic-virtual-reality-headset.png" alt="realistic virtual reality headset" />
            </div>
          </div>
        </section>

        <section className="featured_section">
          <h2 className="featured-section-title">Featured Products</h2>
          <div id="js-featured-products" className="featured_products">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </section>

        <section id="offers" className="offers_section">
          <h2 className="offers-section-title">Special Offers</h2>
          <div id="js-offer-products" className="offers_products">
            {offerProducts.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </section>

        <section id="locations" className="locations_section">
          <div className="iframe_wrapper">
            <div className="contact">
              <div className="contact-title-wrapper">
                <h2><i className="fas fa-phone-alt"></i> Contact Us</h2>
                <p className="contact-intro">Have a question or need help? Reach out — we&apos;re happy to assist.</p>
              </div>
              <ul className="contact-list">
                <li className="contact-item"><i className="fas fa-map-marker-alt"></i> 123 Voltix, Suite 400, Madrid, ES</li>
                <li className="contact-item"><i className="fas fa-phone"></i> <a href="tel:+34123456789">+34 123 456 789</a></li>
                <li className="contact-item"><i className="fas fa-envelope"></i> <a href="mailto:support@voltix.example">support@voltix.example</a></li>
                <li className="contact-item"><i className="fas fa-clock"></i> Mon–Fri: 9:00 — 18:00</li>
              </ul>
              <div className="social-links">
                <a href="#" aria-label="Follow on Facebook" className="social"><i className="fab fa-facebook-f"></i></a>
                <a href="#" aria-label="Follow on Twitter" className="social"><i className="fab fa-twitter"></i></a>
                <a href="#" aria-label="Follow on Instagram" className="social"><i className="fab fa-instagram"></i></a>
                <a href="#" aria-label="Follow on Linkedin" className="social"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
            <div id="iframe">
              <h2><i className="fas fa-map"></i> Locations</h2>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d1159047.2587492393!2d-3.7037902!3d40.4167754!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1smadrid+tokyo+new+york+paris+ciudad+de+mexico!5e0!3m2!1ses!2ses!4v1700000000000!5m2!1ses!2ses"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title="Voltix Locations Map"
              ></iframe>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <h2 className="voltix_logo"><span>V</span>oltix</h2>
        <a href="#hero" id="ArrowUp"><i className="fa-solid fa-arrow-up"></i></a>
      </footer>
    </div>
  )
}

export default Home
