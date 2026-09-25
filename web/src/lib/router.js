import { useEffect, useState } from 'react';

// Tiny hash router — keeps the demo deployable as static files anywhere.
// Routes: #/  #/demo  #/pricing  #/s/:slug/login  #/s/:slug/:role/:module
export function parse(hash = window.location.hash) {
  const parts = hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  if (parts[0] === 's') return { page: parts[2] === 'login' ? 'login' : 'app', slug: parts[1], role: parts[2] === 'login' ? null : parts[2], module: parts[3] || 'dashboard' };
  return { page: parts[0] || 'home' };
}

export function navigate(path) {
  if (window.location.hash !== `#${path}`) window.location.hash = path;
  window.scrollTo(0, 0);
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse());
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
