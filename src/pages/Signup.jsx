import '../../css/signup_voltix.css'

function Signup() {
  return (
    <div className="wrapper">
      <div className="box">
        <form>
          <h2><span>V</span>oltix</h2>
          <div className="form-username">
            <label>Username
              <input placeholder="Username" type="text" required />
            </label>
          </div>
          <div className="form-email">
            <label>Email
              <input placeholder="Email" type="email" required />
            </label>
          </div>
          <div className="form-password">
            <label>Password
              <input placeholder="Password" type="password" required />
            </label>
          </div>
          <div className="form-button">
            <button type="submit">Sign In</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup
