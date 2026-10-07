import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component protects routes by checking if the current user is logged in and authorized.
// Step 1: Access authentication context (user and loading state).
// Step 2: If authentication is still loading, render nothing.
// Step 3: If user is not logged in, redirect to login page.
// Step 4: If role restrictions are specified and user lacks allowed role, redirect to home page.
// Step 5: Otherwise, render children elements.
export default function ProtectedRoute(props) {
  const childrenElements = props.children;
  const allowedRolesArray = props.roles;

  const authContext = useAuth();
  const currentUser = authContext.user;
  const isAuthLoading = authContext.loading;

  // Step 2: Do not render protected route while checking initial auth status
  if (isAuthLoading) {
    return null;
  }

  // Step 3: Redirect to login if user is unauthenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Step 4: Check role permissions if an allowed roles array was provided
  if (allowedRolesArray) {
    if (Array.isArray(allowedRolesArray)) {
      const currentUserRole = currentUser.role;
      if (!allowedRolesArray.includes(currentUserRole)) {
        return <Navigate to="/" replace />;
      }
    }
  }

  // Step 5: Render child page component if authorized
  return childrenElements;
}
