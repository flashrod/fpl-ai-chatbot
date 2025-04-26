
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Wand2, LayoutDashboard } from 'lucide-react';
import './NavBar.css';

const NavBar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/chat",
      icon: MessageSquare,
      label: "Chat",
    },
    {
      path: "/chips",
      icon: Wand2,
      label: "Chips",
    },
  ];

  return (
    <header className="navbar-header">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="logo-link">
            <span className="logo-icon">⚽</span>
            <span className="logo-text">
              <span className="logo-highlight">FPL</span> AI
            </span>
          </Link>

          <div className="divider" />

          <div className="nav-links">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
              >
                <item.icon className="nav-icon" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
