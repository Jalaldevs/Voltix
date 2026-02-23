import { Link } from 'react-router-dom'
import '../../css/cart.css'

function Cart() {
  return (
    <>
      <header className="navbar">
        <h2 className="logo">Voltix</h2>
        <div className="nav-icons">
          <Link to="/signup" className="nav-link">
            <i className="fa-solid fa-user"></i>
            <span>Account</span>
          </Link>
          <a href="#" className="nav-link cart-link">
            <i className="fa-solid fa-cart-shopping"></i>
            <span>Cart</span>
            <div className="cart-badge">2</div>
          </a>
        </div>
      </header>
      <section className="cart-container">
        <h1>Your Shopping Cart</h1>
        <div className="cart-item">
          <img src="/images/backpack (2).jpg" alt="Backpack" />
          <div className="cart-info">
            <h3>Travel Backpack</h3>
            <p>$79.99</p>
            <select>
              <option>1</option>
              <option>2</option>
              <option>3</option>
            </select>
          </div>
          <button className="remove-btn">Remove</button>
        </div>
        <div className="cart-item">
          <img src="/images/men-cozy-fleece-zip-up-hoodie-red.jpg" alt="Hoodie" />
          <div className="cart-info">
            <h3>Cozy Fleece Hoodie</h3>
            <p>$49.99</p>
            <select>
              <option>1</option>
              <option>2</option>
              <option>3</option>
            </select>
          </div>
          <button className="remove-btn">Remove</button>
        </div>
        <div className="cart-total">
          <h2>Total: <span>$129.98</span></h2>
          <button className="checkout-btn">Proceed to Checkout</button>
        </div>
      </section>
    </>
  )
}

export default Cart
