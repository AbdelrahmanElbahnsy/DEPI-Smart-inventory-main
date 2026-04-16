import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import AnimatedOutlet from './AnimatedOutlet.jsx';

export default function MainLayout() {
  const getIsMobile = () => window.innerWidth < 1024;
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [drawerOpen, setDrawerOpen] = useState(() => !getIsMobile());

  // Track viewport size
  useEffect(() => {
    const handleResize = () => {
      const mobile = getIsMobile();
      setIsMobile(mobile);
      setDrawerOpen(!mobile);
      if (!mobile) document.body.style.overflow = '';
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // run on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll ONLY on mobile when drawer is open
  useEffect(() => {
    if (isMobile && drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen, isMobile]);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <div className={`app-layout ${drawerOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar isOpen={drawerOpen} onClose={closeDrawer} isMobile={isMobile} />
      <main
        className="main-content"
        style={
          !isMobile && drawerOpen
            ? { marginLeft: '280px', width: 'calc(100% - 280px)', minHeight: '100vh', transition: 'margin 0.3s ease' }
            : { marginLeft: '0px', width: '100%', minHeight: '100vh', transition: 'margin 0.3s ease' }
        }
      >
        <Topbar onMenuToggle={toggleDrawer} />
        <div className="page-content page-enter-active">
          <AnimatedOutlet />
        </div>
      </main>
    </div>
  );
}
