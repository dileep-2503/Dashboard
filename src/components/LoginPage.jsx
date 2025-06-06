import React, { useState, useEffect } from 'react';
import { login, register } from '../api/api';
import '../styles/Login.css'; // Custom CSS file for the login page
import loginImage from '../assets/login.svg'; // Import the login image

function LoginPage({ onLogin, message, setMessage }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, setLoginState] = useState('login');

  useEffect(() => {
    // Clear the message when loginState changes
    setMessage('');
  }, [loginState, setMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' || name === 'username') {
      if (/^[A-Za-z]*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'email') {
      if (/^[A-Za-z0-9@.]*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    if (loginState === 'register' && formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (loginState === 'login') {
      // Handle login logic here
      try {
        const response = await login(formData.username, formData.password);
        if (response.message === 'Login successful') {
          onLogin(formData.username, formData.password, response.product_access, response.user_category, response.segments, response.empid, response.user_level, response.state_location || '');
        } else {
          setMessage('Invalid username or password');
        }
      } catch (error) {
        setMessage('Error logging in');
      }
    } else {
      // Handle registration logic here
      try {
        const response = await register(formData.name, formData.username, formData.password);
        setMessage(response.message);
      } catch (error) {
        setMessage('Error registering user');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-image">
          <img src={loginImage} alt="Login" />
        </div>
        <div className="login-form">
          <h2 className="login-form-title">{loginState === 'login' ? 'Login' : 'Register'}</h2>
          {message && <p className="message">{message}</p>}
          <form onSubmit={handleSubmit}>
            {loginState === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Name</label>
                  <input
                    className="form-input"
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                className="form-input"
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            {loginState === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <input
                className="form-checkbox"
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label className="form-label" htmlFor="showPassword">Show Password</label>
            </div>
            <div className="form-group form-actions">
              <button className="form-button" type="submit">{loginState === 'login' ? 'Login' : 'Register'}</button>
              {loginState === 'login' ? (
                <p className="switch-text">
                  Don't have an account? <span className="switch-link" onClick={() => setLoginState('register')}>Register</span>
                </p>
              ) : (
                <p className="switch-text">
                  Already have an account? <span className="switch-link" onClick={() => setLoginState('login')}>Login</span>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;