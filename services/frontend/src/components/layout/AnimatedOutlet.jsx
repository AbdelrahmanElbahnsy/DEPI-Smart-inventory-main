import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { cloneElement } from 'react';

/**
 * AnimatedOutlet — wraps react-router's <Outlet> with <AnimatePresence>
 * so that page exit AND enter animations are both respected.
 * Each page must be wrapped with <AnimatedPage> for it to work.
 */
export default function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      {outlet && cloneElement(outlet, { key: location.pathname })}
    </AnimatePresence>
  );
}
