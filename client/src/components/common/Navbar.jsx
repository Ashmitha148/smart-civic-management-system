import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Landmark,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/civicConstants';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-civic-100 text-civic-800 font-semibold'
        : 'text-slate-600 hover:text-civic-800 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="bg-civic-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Municipal Citizen Services Portal</span>
          </div>
          <span className="hidden sm:inline text-slate-400">
            24/7 Civic Issue Reporting &amp; Tracking
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-civic-800 text-white flex items-center justify-center shadow-sm group-hover:bg-civic-700 transition-colors">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-base font-bold text-civic-900 tracking-tight leading-none">
                SCMS Portal
              </span>
              <span className="block text-[11px] font-medium text-slate-500 mt-0.5">
                Smart Civic Management System
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            {isAuthenticated && user?.role === ROLES.CITIZEN && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </span>
                </NavLink>
                <NavLink to="/complaints" end className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" />
                    My Complaints
                  </span>
                </NavLink>
                <NavLink to="/complaints/new" className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <FilePlus2 className="w-4 h-4" />
                    Report Issue
                  </span>
                </NavLink>
              </>
            )}
            {isAuthenticated && user?.role === ROLES.OFFICIAL && (
              <>
                <NavLink to="/admin" end className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Dashboard
                  </span>
                </NavLink>
                <NavLink to="/admin/complaints" className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" />
                    All Complaints
                  </span>
                </NavLink>
                <NavLink to="/admin/workers" className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Workers
                  </span>
                </NavLink>
                <NavLink to="/admin/analytics" className={navLinkClass}>
                  Analytics
                </NavLink>
                <NavLink to="/admin/heatmap" className={navLinkClass}>
                  Heatmap
                </NavLink>
              </>
            )}
            {isAuthenticated && user?.role === ROLES.WORKER && (
              <>
                <NavLink to="/worker" end className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" />
                    Worker Dashboard
                  </span>
                </NavLink>
                <NavLink to="/worker/tasks" className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" />
                    My Tasks
                  </span>
                </NavLink>
              </>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="text-right pr-2 border-r border-slate-200">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role} Account</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-civic-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-civic-800 hover:bg-civic-700 rounded-lg shadow-sm transition-colors"
                >
                  Citizen Register
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          <NavLink
            to="/"
            end
            className={navLinkClass}
            onClick={() => setMobileOpen(false)}
          >
            Home
          </NavLink>
          {isAuthenticated && user?.role === ROLES.CITIZEN ? (
            <>
              <NavLink
                to="/dashboard"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/complaints"
                end
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                My Complaints
              </NavLink>
              <NavLink
                to="/complaints/new"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Report an Issue
              </NavLink>
              <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 mt-2 border-t border-slate-200 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2 text-sm font-medium text-civic-800 bg-slate-100 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-civic-800 rounded-lg"
              >
                Citizen Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
