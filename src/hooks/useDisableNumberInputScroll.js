import { useEffect } from 'react';

function useDisableNumberInputScroll() {
  useEffect(() => {
    const handleWheel = (e) => {
      // Only prevent default if the element is a number input
      if (e.target.type === 'number') {
        e.preventDefault();
      }
    };
    
    // Add event listener to the document
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    // Clean up
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);
}

export default useDisableNumberInputScroll;