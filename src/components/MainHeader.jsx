import React, { useState, useRef, useEffect } from 'react';
import '../styles/MainHeader.css';
import { Menu, User, LogOut, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import chola from '../assets/chola.png';

function Header({ toggleSidebar, productExactName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const shouldShowProductName = () => {
    const allowedPaths = ['/final-page', '/general', '/package'];
    return allowedPaths.includes(location.pathname);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
    window.location.href = '/dynamic_rater';
  };

  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      {/* Left section with logo and navigation toggle */}
      <div className="header-left">
        <button 
          onClick={toggleSidebar}
          className="burger-button"
          aria-label="Toggle Navigation"
        >
          <Menu size={40} />
        </button>
        
        <div className="brand-container">
          <div className="logo-placeholder">
            <img src={chola} alt="chola-ms" />
          </div>
          <div className="brand-text">
            <h1>Chola MS</h1>
            <p>General Insurance</p>
          </div>
        </div>
      </div>

      <div className="header-center">
        {productExactName && (
          <h3 className="product-title">{shouldShowProductName() ? productExactName : ''}</h3>
        )}
      </div>
      
      {/* Right section with actions */}
      <div className="header-right">
        <div className="action-buttons" ref={dropdownRef}>
          {/* Home button */}
          <button 
            className="icon-button home-btn" 
            aria-label="Go to home" 
            onClick={handleHomeClick}
          >
            <Home size={20} />
          </button>
          
          {/* User profile button */}
          <button 
            className="icon-button profile-btn" 
            aria-label="User profile" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <User size={20} />
          </button>
          
          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-item" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;