import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import SearchModal from './SearchModal';

export default function Header() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuState, setMenuState] = useState(() => ({
    open: false,
    path: location.pathname,
  }));
  const isMenuOpen = menuState.open && menuState.path === location.pathname;

  const closeMenu = () => {
    setMenuState({ open: false, path: location.pathname });
  };

  const toggleMenu = () => {
    setMenuState((prev) => {
      const samePath = prev.path === location.pathname;
      return {
        open: samePath ? !prev.open : true,
        path: location.pathname,
      };
    });
  };

  return (
    <>
      <header className="header">
        <nav className="nav">
          <Link className="logo logo-link" to="/" aria-label="На главную">
            ТОМСК МОДЕРНИЗМ
          </Link>
          <div className={`nav-links-wrapper ${isMenuOpen ? 'open' : ''}`}>
            <Navigation onNavigate={closeMenu} />
          </div>
          <div className="nav-actions">
            <button
              className="search-btn"
              onClick={() => setSearchOpen(true)}
              title="Поиск"
              aria-label="Открыть поиск"
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className="menu-btn"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-label="Открыть меню"
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>
      </header>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
