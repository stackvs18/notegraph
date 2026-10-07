import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Note: Navbar is fixed (position: fixed, height: 52px).
// Page content wrappers must use padding-top: 68px (52px + offset) to avoid overlap.

// This navigation bar component displays logo, navigation links based on user login state and role, and a logout button.
// Step 1: Access auth context, router location, and navigation hook.
// Step 2: Handle user logout action.
// Step 3: Compute active link styling based on current URL path.
// Step 4: Render logo and conditional navigation links (guest vs logged in user vs admin).
export default function Navbar() {
  const authContext = useAuth();
  const currentUser = authContext.user;
  const logoutUserFunction = authContext.logout;

  const currentLocation = useLocation();
  const navigateFunction = useNavigate();

  // Step 2: Handle logout button click
  function handleLogout() {
    logoutUserFunction();
    navigateFunction('/');
  }

  // Step 3: Compute inline style object for navigation links based on active status
  function getLinkStyle(targetPathString) {
    const currentPathnameString = currentLocation.pathname;
    let isLinkActive = false;

    if (targetPathString === '/notes') {
      if (currentPathnameString === '/' || currentPathnameString === '/notes') {
        isLinkActive = true;
      }
    } else {
      if (currentPathnameString === targetPathString) {
        isLinkActive = true;
      } else if (targetPathString !== '/' && currentPathnameString.startsWith(targetPathString)) {
        isLinkActive = true;
      }
    }

    let linkTextColor = '#6E6E73';
    if (isLinkActive) {
      linkTextColor = '#007AFF';
    }

    let linkFontWeight = 400;
    if (isLinkActive) {
      linkFontWeight = 600;
    }

    return {
      color: linkTextColor,
      fontWeight: linkFontWeight,
      textDecoration: 'none',
      fontSize: '14px',
    };
  }

  const navContainerStyle = {
    height: '52px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E5E7',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
  };

  const rightNavStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  };

  // Determine user initial avatar character without ternary
  let userInitialAvatarLetter = 'U';
  if (currentUser) {
    if (currentUser.username) {
      userInitialAvatarLetter = currentUser.username[0].toUpperCase();
    }
  }

  let isUserAdminOrSuperadmin = false;
  if (currentUser) {
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      isUserAdminOrSuperadmin = true;
    }
  }

  return (
    <nav style={navContainerStyle}>
      {/* Left Logo Cluster */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#007AFF',
            borderRadius: '50%',
            display: 'inline-block',
          }}
        />
        <span style={{ color: '#1D1D1F', fontWeight: 'bold', fontSize: '16px' }}>NoteGraph</span>
      </Link>

      {/* Right Navigation Cluster */}
      <div style={rightNavStyle}>
        {!currentUser ? (
          <React.Fragment>
            <Link to="/notes" style={getLinkStyle('/notes')}>
              Notes
            </Link>
            <Link to="/graph" style={getLinkStyle('/graph')}>
              Graph
            </Link>
            <Link to="/login" style={getLinkStyle('/login')}>
              Log in
            </Link>
            <Link
              to="/signup"
              style={{
                backgroundColor: '#007AFF',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Sign up
            </Link>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Link to="/notes" style={getLinkStyle('/notes')}>
              Notes
            </Link>
            <Link to="/editor" style={getLinkStyle('/editor')}>
              Editor
            </Link>
            <Link to="/graph" style={getLinkStyle('/graph')}>
              Graph
            </Link>
            <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
              Dashboard
            </Link>
            {isUserAdminOrSuperadmin && (
              <Link to="/admin" style={getLinkStyle('/admin')}>
                Admin
              </Link>
            )}

            {/* Avatar */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid #007AFF',
                color: '#007AFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              {userInitialAvatarLetter}
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#6E6E73',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              Logout
            </button>
          </React.Fragment>
        )}
      </div>
    </nav>
  );
}
