import './App.css';
import React, { useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MainHeader from './components/MainHeader';
import Home from './components/Home';
import LoginPage from './components/LoginPage';
import Package from './components/Package';
import GeneralDetails from './components/GeneralDetails';
import Section from './components/Section';
import SectionDetails from './components/SectionDetails';
import Product from './components/Product';
import ProductDetails from './components/ProductDetails';
import Occupancy from './components/Occupancy';
import OccupancyRate from './components/OccupancyRate';
import Pincode from './components/Pincode';
import PreviewPage from './components/PreviewPage';
import UserDetails from './components/UserDetails';
import Quote from './components/Quote';
import AddonCover from './components/AddonCover';
import RiskFactor from './components/RiskFactor';
import Components from './components/ComponentsDetails';
import SectionList from './components/SectionList';
import Draft from './components/Draft';
import PendingQuotes from './components/PendingQuotes';
import QuoteDetails from './components/QuoteDetails';
import useDisableNumberInputScroll from './hooks/useDisableNumberInputScroll';

function App() {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [productAccess, setProductAccess] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [userCategory, setUserCategory] = useState('');
  const [user, setUser] = useState('');
  const [productExactName, setProductExactName] = useState('');
  const [userSegment, setUserSegment] = useState('');
  const [userLevel, setUserLevel] = useState('');
  const [stateLocation, setStateLocation] = useState('');
  useDisableNumberInputScroll();

  const handleLogin = (username, password, productAccess, userCate, userSegment, empid, user_level, state_location) => {
    setMessage('Login successful');
    setProductAccess(productAccess);
    setUserCategory(userCate);
    setUserSegment(userSegment);
    setUserLevel(user_level);
    setStateLocation(state_location);
    setUser(`${username}-${empid}`);
    setIsLoggedIn(true);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <BrowserRouter basename="/dynamic_rater">
      <div className="App">
        {isLoggedIn ? (
          <>
            <MainHeader 
              toggleSidebar={toggleSidebar}
              productExactName={productExactName} 
            />
            <Sidebar
              isSidebarVisible={isSidebarVisible}
              toggleSidebar={toggleSidebar}
              productAccess={productAccess}
              userCategory={userCategory}
              user={user}
              onHomeClick={() => setSidebarVisible(false)}
            />
            {isSidebarVisible && <div className="backdrop" onClick={toggleSidebar}></div>}
            <div className="content">
              <Routes>
                <Route path="/home" element={<Home productAccess={productAccess} user={user} userLevel={userLevel} />} />
                <Route 
                  path="/package" 
                  element={
                    <Package 
                      setSelectedPackages={setSelectedPackages} 
                      setProductExactName={setProductExactName}
                    />
                  } 
                />
                <Route path="/general" element={<GeneralDetails selectedPackages={selectedPackages} user={user} userSegment={userSegment} />} />
                <Route path="/section" element={<Section user={user}/>} />
                <Route path="/product" element={<Product user={user}/>} />
                <Route path="/section-details" element={<SectionDetails user={user} />} />
                <Route path="/product-details" element={<ProductDetails user={user} />} />
                <Route path="/occupancy" element={<Occupancy />} />
                <Route path="/occupancy-rate" element={<OccupancyRate user={user} />} />
                <Route path="/pincode" element={<Pincode user={user} />} />
                <Route path="*" element={<Navigate to="/home" />} />
                <Route path="/pending-quotes" element={<PendingQuotes user={user} userLevel={userLevel} />} />
                <Route path="/final-page" element={<PreviewPage user={user} userLevel={userLevel} />} />
                <Route path="/users" element={<UserDetails user={user} />} />
                <Route path="/quotes" element={<Quote user={user} setProductExactName={setProductExactName} />} />
                <Route path="/drafts" element={<Draft user={user} setProductExactName={setProductExactName} />}/>
                <Route path="/addon-cover" element={<AddonCover user={user} />} />
                <Route path="/risk-factor" element={<RiskFactor user={user} />} />
                <Route path="/components-details" element={<Components user={user} />} />
                <Route path="/section-list" element={<SectionList user={user} />} />
                <Route path="/quote-details" element={<QuoteDetails user={user} userLevel={userLevel} />} />
              </Routes>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} message={message} setMessage={setMessage} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;