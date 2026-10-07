import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe as getMeApi } from '../api/auth';

// This context object allows authentication state and actions to be shared across all components in the app.
export const AuthContext = React.createContext(null);

// This provider component wraps child components and supplies authentication state and functions.
export function AuthProvider(props) {
  const children = props.children;

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect to check and restore authentication status when the component mounts.
  // Step 1: Look for an existing authentication token in browser localStorage.
  // Step 2: If a token is found, validate it by fetching current user details from the API server.
  // Step 3: If validation succeeds, update user and token state; if it fails, clear invalid token.
  // Step 4: Set loading state to false once the check is complete.
  useEffect(function () {
    async function checkExistingAuthentication() {
      // Step 1: Retrieve token from browser storage
      const savedAuthenticationToken = localStorage.getItem('notegraph_token');

      if (savedAuthenticationToken) {
        try {
          // Step 2: Validate token with backend API
          const userResponseData = await getMeApi(savedAuthenticationToken);
          const currentUserObject = userResponseData.user;

          // Step 3: Set authenticated user state and token
          setUser(currentUserObject);
          setToken(savedAuthenticationToken);
        } catch (errorObject) {
          console.error('Initial auth validation failed:', errorObject);

          // Reset stored token and state if token validation fails
          localStorage.removeItem('notegraph_token');
          setUser(null);
          setToken(null);
        }
      }

      // Step 4: Mark initial authentication check as completed
      setLoading(false);
    }

    checkExistingAuthentication();
  }, []);

  // Function to log in an existing user with username and password.
  // Step 1: Send login credentials to the authentication API.
  // Step 2: Save returned authentication token to localStorage.
  // Step 3: Update React state with user object and token.
  // Step 4: Return success object { success: true }, or error object { success: false, message } on failure.
  async function loginUser(username, password) {
    try {
      // Step 1: Send request to login endpoint
      const loginCredentials = {
        username: username,
        password: password
      };
      const apiResponseData = await loginApi(loginCredentials);

      const receivedAuthenticationToken = apiResponseData.token;
      const authenticatedUserObject = apiResponseData.user;

      // Step 2: Store token in browser localStorage
      localStorage.setItem('notegraph_token', receivedAuthenticationToken);

      // Step 3: Update React state
      setUser(authenticatedUserObject);
      setToken(receivedAuthenticationToken);

      // Step 4: Return success result
      return { success: true };
    } catch (errorObject) {
      let errorMessage = 'Login failed';

      // Step-by-step extraction of error message from response
      if (errorObject) {
        if (errorObject.response) {
          if (errorObject.response.data) {
            if (errorObject.response.data.message) {
              errorMessage = errorObject.response.data.message;
            }
          }
        }
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Function to register a new user with username, email, and password.
  // Step 1: Send registration details to the authentication API.
  // Step 2: Save returned authentication token to localStorage.
  // Step 3: Update React state with user object and token.
  // Step 4: Return success object { success: true }, or error object { success: false, message } on failure.
  async function registerUser(username, email, password) {
    try {
      // Step 1: Send request to register endpoint
      const registrationCredentials = {
        username: username,
        email: email,
        password: password
      };
      const apiResponseData = await registerApi(registrationCredentials);

      const receivedAuthenticationToken = apiResponseData.token;
      const registeredUserObject = apiResponseData.user;

      // Step 2: Store token in browser localStorage
      localStorage.setItem('notegraph_token', receivedAuthenticationToken);

      // Step 3: Update React state
      setUser(registeredUserObject);
      setToken(receivedAuthenticationToken);

      // Step 4: Return success result
      return { success: true };
    } catch (errorObject) {
      let errorMessage = 'Registration failed';

      // Step-by-step extraction of error message from response
      if (errorObject) {
        if (errorObject.response) {
          if (errorObject.response.data) {
            if (errorObject.response.data.message) {
              errorMessage = errorObject.response.data.message;
            }
          }
        }
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Function to log out the current user.
  // Step 1: Remove the authentication token from localStorage.
  // Step 2: Reset user and token React states to null.
  function logout() {
    // Step 1: Delete token from browser storage
    localStorage.removeItem('notegraph_token');

    // Step 2: Clear state variables
    setUser(null);
    setToken(null);
  }

  // Object containing all authentication data and functions to be provided to child components
  const authenticationContextValue = {
    user: user,
    token: token,
    loading: loading,
    loginUser: loginUser,
    registerUser: registerUser,
    logout: logout
  };

  return (
    <AuthContext.Provider value={authenticationContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom React hook to easily access authentication context within child components.
// Step 1: Call React.useContext with AuthContext.
// Step 2: Verify context exists to ensure hook is called within an AuthProvider.
// Step 3: Return context value.
export function useAuth() {
  // Step 1: Read AuthContext value
  const contextValue = useContext(AuthContext);

  // Step 2: Throw error if used outside AuthProvider
  if (!contextValue) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Step 3: Return context
  return contextValue;
}
