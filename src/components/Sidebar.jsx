import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import '../styles/Sidebar.css';
import chola from '../assets/chola.png';
import { fetchProduct } from '../api/api';
import { 
  Home, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  X, 
  BarChart, 
  Settings,
  Users, 
  User,
  Shield, 
  Map, 
  Package, 
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  FileText
} from 'lucide-react';

const Portal = ({ children }) => {
  const [portalRoot, setPortalRoot] = useState(null);
  const el = useRef(document.createElement('div'));

  useEffect(() => {
    let root = document.getElementById('portal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'portal-root';
      document.body.appendChild(root);
    }
    
    setPortalRoot(root);
    root.appendChild(el.current);
    
    return () => {
      if (root && el.current) {
        root.removeChild(el.current);
      }
    };
  }, []);
  
  return portalRoot ? ReactDOM.createPortal(children, el.current) : null;
};


const SidebarItem = ({ item, onClick, toggleSidebar }) => {
  const [isExpanded, setExpanded] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [currentItem, setCurrentItem] = useState(null);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close popup when clicking outside
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setPopupVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleExpand = () => {
    setExpanded(!isExpanded);
  };

  const handleClick = (e) => {
    if (item.children) {
      toggleExpand();
    } else if (item.showPopup) {
      e.stopPropagation();
      
      // Position popup to the right of the mouse pointer
      const xOffset = 5; // Offset from cursor
      
      setPopupPosition({ 
        top: e.clientY + window.scrollY, 
        left: e.clientX + window.scrollX + xOffset
      });
      
      setCurrentItem(item);
      setPopupVisible(true);
    } else {
      onClick();
      toggleSidebar();
    }
  };

  const handleOptionClick = (action) => {
    if (currentItem) {
      const name = currentItem.name;
      
      switch(action) {
        case 'new':
          currentItem.onClick('new');
          break;
        case 'view-quote':
          navigate('/quotes', { state: { productFilter: name } });
          break;
        case 'modify-quote':
          navigate('/quotes', { state: { productFilter: name, editMode: true } });
          break;
        case 'view-policy':
          navigate('/policies', { state: { productFilter: name } });
          break;
        default:
          break;
      }
    }
    setPopupVisible(false);
  };

  return (
    <div className={`sidebar-item-container ${isExpanded ? 'expanded' : ''}`}>
      <div 
        className={`sidebar-item ${item.children ? 'has-children' : ''} ${isExpanded ? 'active' : ''}`} 
        onClick={handleClick}
      >
        <div className="sidebar-item-content">
          {item.icon && <span className="item-icon">{item.icon}</span>}
          <span className="item-text">{item.name}</span>
        </div>
        {item.children && (
          <span className="expand-icon">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </div>
      {isExpanded && item.children && (
        <div className="sidebar-subitems">
          {item.children.map((child, index) => (
            <SidebarItem 
              key={index} 
              item={child} 
              onClick={child.onClick} 
              toggleSidebar={toggleSidebar} 
            />
          ))}
        </div>
      )}
      
      {/* Popup menu - rendered through portal outside the sidebar */}
      {popupVisible && (
        <Portal>
          <div 
            className="sidebar-popup-menu" 
            ref={popupRef}
            style={{ 
              top: `${popupPosition.top}px`, 
              left: `${popupPosition.left}px`,
              position: 'fixed', 
              zIndex: 2000 
            }}
          >
            <div className="popup-title">{currentItem?.name}</div>
            <div className="popup-options">
              <div className="popup-option" onClick={() => handleOptionClick('new')}>
                <Plus size={16} className="option-icon" />
                <span>New Proposal</span>
              </div>
              <div className="popup-option" onClick={() => handleOptionClick('view-quote')}>
                <Eye size={16} className="option-icon" />
                <span>View Quote</span>
              </div>
              <div className="popup-option" onClick={() => handleOptionClick('modify-quote')}>
                <Edit size={16} className="option-icon" />
                <span>Modify Quote</span>
              </div>
              <div className="popup-option" onClick={() => handleOptionClick('view-policy')}>
                <FileText size={16} className="option-icon" />
                <span>View Policy</span>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

function Sidebar({ isSidebarVisible, toggleSidebar, productAccess, userCategory, user }) {
  const navigate = useNavigate();
  const [sectionsData, setSectionsData] = useState([]);
  const [sidebarItems, setSidebarItems] = useState([]);
  const sidebarRef = useRef(null);
  
  // Parse product access string into an array
  const accessibleProducts = productAccess ? productAccess.split(',').map(p => p.trim()) : [];

  // Function to check if user has access to a specific product
  const hasAccess = (productName) => {
    return accessibleProducts.includes(productName) || accessibleProducts.includes('FULL');
  };

  // Check if user is an admin
  const isAdmin = userCategory === 'Admin';

  useEffect(() => {
    const getProduct = async () => {
      try {
        const data = await fetchProduct();
        setSectionsData(data);
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };

    getProduct();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (isSidebarVisible && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        toggleSidebar(); // Close the sidebar
      }
    }

    if (isSidebarVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarVisible, toggleSidebar]);

  useEffect(() => {
    // Create sidebar items dynamically whenever sectionsData changes
    if (sectionsData.length > 0) {
      // Generate child items for Rater based on fetched sections
      const raterChildren = sectionsData
        .map(section => {
          // Check if user has access to this section
          if (hasAccess(section.name)) {
            return { 
              name: section.name, 
              icon: <Package size={16} />,
              showPopup: true, // Flag to show popup when clicked
              onClick: (action) => handleLinkClick(section.name, action)
            };
          }
          return null;
        })
        .filter(Boolean); // Filter out null values

      // Start with base items that are always visible
      const items = [
        { name: 'Home', icon: <Home size={18} />, onClick: onHomeClick },
        {
          name: 'Rater',
          icon: <Layers size={18} />,
          children: raterChildren,
        }
      ];

      // Add admin-only menu items if the user is an admin
      if (isAdmin) {
        items.push({
          name: 'Configure',
          icon: <Settings size={18} />,
          children: [
            { name: 'Section', icon: <BarChart size={16} />, onClick: () => navigate('/section-details') },
            { name: 'Components', icon: <Package size={16} />, onClick: () => navigate('/components-details') },
            { name: 'Section List', icon: <Layers size={16} />, onClick: () => navigate('/section-list') },
            { name: 'Product', icon: <Shield size={16} />, onClick: () => navigate('/product-details') },
            { name: 'Occupancy', icon: <BarChart size={16} />, onClick: () => navigate('/occupancy') },
            { name: 'Occupancy Group', icon: <BarChart size={16} />, onClick: () => navigate('/occupancy-rate') },
            { name: 'Pincode', icon: <Map size={16} />, onClick: () => navigate('/pincode') },
            { name: 'Users', icon: <Users size={16} />, onClick: () => navigate('/users') },
            { name: 'AddOn Cover', icon: <Shield size={16} />, onClick: () => navigate('/addon-cover') },
            { name: 'Risk Factor', icon: <AlertTriangle size={16} />, onClick: () => navigate('/risk-factor') }
          ]
        });
      }

      setSidebarItems(items);
    }
  }, [sectionsData, productAccess, userCategory]); // Recalculate when sections, access, or user category changes

  const onHomeClick = () => {
    navigate('/home');
    toggleSidebar();
  };

  const handleLinkClick = (name, action) => {
    const section = sectionsData.find(sec => sec.name === name);
    if (section) {
      const items = section.section.split(', ').map(item => item.trim());
      
      if (action === 'new' || !action) {
        navigate('/package', { state: { title: section.name, items, action: 'new' } });
      }
      // Other actions are handled in the SidebarItem component
    }
  };

  const handleSidebarClick = (event) => {
    event.stopPropagation();
  };

  return (
    <div
      ref={sidebarRef}
      className={`sidebar ${isSidebarVisible ? 'visible' : 'hidden'}`}
      onClick={handleSidebarClick}
    >
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src={chola} alt="Chola MS Logo" className="sidebar-logo" />
          <span className="sidebar-title">Chola MS</span>
        </div>
        <button className="close-btn" onClick={toggleSidebar}>
          <X size={20} />
        </button>
      </div>
      
      <div className="sidebar-divider"></div>
      
      <div className="sidebar-content">
        {sidebarItems.map((item, index) => (
          <SidebarItem 
            key={index} 
            item={item} 
            onClick={item.onClick} 
            toggleSidebar={toggleSidebar} 
          />
        ))}
      </div>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-details">
            <div className="user-name">{user.split('-')[0]}</div>
            <div className="user-role">{userCategory || 'Agent'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;