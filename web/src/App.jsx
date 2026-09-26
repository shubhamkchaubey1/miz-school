import Icon from './components/Icon.jsx';
import { useEffect } from 'react';
import { useRoute } from './lib/router.js';
import { SchoolProvider, useSchool, applyBrand } from './lib/store.jsx';
import { roleByKey } from './config/roles.js';
import AppShell from './layout/AppShell.jsx';
import Landing from './pages/public/Landing.jsx';
import DemoSelect from './pages/public/DemoSelect.jsx';
import Pricing from './pages/public/Pricing.jsx';
import Features from './pages/public/Features.jsx';
import Login from './pages/public/Login.jsx';
import { MODULE_PAGES } from './pages/modules/index.js';
import { Crest } from './components/Brand.jsx';

export default function App() {
  const route = useRoute();
  useEffect(() => { if (route.page !== 'app' && route.page !== 'login') applyBrand(null); }, [route.page]);

  if (route.page === 'login') return <Login slug={route.slug} />;
  if (route.page === 'app') {
    const role = roleByKey(route.role) ? route.role : 'school_admin';
    return (
      <SchoolProvider slug={route.slug} role={role}>
        <SchoolApp module={route.module} />
      </SchoolProvider>
    );
  }
  if (route.page === 'demo') return <DemoSelect />;
  if (route.page === 'pricing') return <Pricing />;
  if (route.page === 'features') return <Features />;
  return <Landing />;
}

function SchoolApp({ module }) {
  const { data, persona, error, access, role } = useSchool();
  if (error) return <div className="empty">Could not load school data: {String(error.message || error)}</div>;
  if (!data || !persona) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="stack" style={{ alignItems: 'center' }}>
          <Crest size={54} />
          <span className="muted">Loading school…</span>
        </div>
      </div>
    );
  }
  const allowed = module === 'dashboard' || !!access[role]?.[module];
  const key = allowed ? module : 'dashboard';
  const Page = MODULE_PAGES[key] || MODULE_PAGES.dashboard;
  const viewOnly = key !== 'dashboard' && access[role]?.[key] === 'view';
  return (
    <AppShell module={key}>
      {viewOnly && <div className="viewonly-bar"><Icon name="eye" size={15} /> View only — you can see this page but not change anything. The school admin can give edit access in Users &amp; Access.</div>}
      <div className={viewOnly ? 'view-only' : undefined}><Page key={`${role}-${key}`} /></div>
    </AppShell>
  );
}
