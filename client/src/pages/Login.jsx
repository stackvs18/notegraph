import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Login page component for user authentication.
// Step 1: Initialize form inputs state (username, password, submitting flag, error message).
// Step 2: Handle form submission to validate inputs and invoke loginUser API.
// Step 3: Redirect to home page on success or display error message on failure.
export default function Login() {
  const usernameState = useState('');
  const usernameInput = usernameState[0];
  const setUsernameInput = usernameState[1];

  const passwordState = useState('');
  const passwordInput = passwordState[0];
  const setPasswordInput = passwordState[1];

  const isSubmittingState = useState(false);
  const isSubmitting = isSubmittingState[0];
  const setIsSubmitting = isSubmittingState[1];

  const errorMessageState = useState('');
  const errorMessageText = errorMessageState[0];
  const setErrorMessageText = errorMessageState[1];

  const authContext = useAuth();
  const loginUserFunction = authContext.loginUser;

  const navigateHook = useNavigate();

  function handleUsernameChange(eventObject) {
    setUsernameInput(eventObject.target.value);
  }

  function handlePasswordChange(eventObject) {
    setPasswordInput(eventObject.target.value);
  }

  // Step 2: Handle form submit action
  async function handleSubmit(eventObject) {
    eventObject.preventDefault();
    setErrorMessageText('');

    const trimmedUsername = usernameInput.trim();
    if (!trimmedUsername || !passwordInput) {
      setErrorMessageText('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const loginResultObject = await loginUserFunction(trimmedUsername, passwordInput);
    setIsSubmitting(false);

    // Step 3: Process authentication result
    if (loginResultObject) {
      if (loginResultObject.success) {
        navigateHook('/');
      } else {
        let failureMessage = 'Login failed';
        if (loginResultObject.message) {
          failureMessage = loginResultObject.message;
        }
        setErrorMessageText(failureMessage);
      }
    }
  }

  // Compute button styling and label text without ternaries
  let submitButtonCursorStyle = 'pointer';
  if (isSubmitting) {
    submitButtonCursorStyle = 'not-allowed';
  }

  let submitButtonOpacity = 1;
  if (isSubmitting) {
    submitButtonOpacity = 0.7;
  }

  let submitButtonLabelText = 'Log in';
  if (isSubmitting) {
    submitButtonLabelText = 'Logging in...';
  }

  return (
    <div
      style={{
        maxWidth: '360px',
        margin: '0 auto',
        paddingTop: '100px',
        paddingLeft: '16px',
        paddingRight: '16px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          color: '#1D1D1F',
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '24px',
          textAlign: 'center',
        }}
      >
        Log in
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="login-username"
            style={{ display: 'block', fontSize: '13px', color: '#6E6E73', marginBottom: '6px' }}
          >
            Username
          </label>
          <input
            id="login-username"
            type="text"
            value={usernameInput}
            onChange={handleUsernameChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E5E5E7',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              color: '#1D1D1F',
              backgroundColor: '#FFFFFF',
            }}
            placeholder="Enter username"
            required
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            style={{ display: 'block', fontSize: '13px', color: '#6E6E73', marginBottom: '6px' }}
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={passwordInput}
            onChange={handlePasswordChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E5E5E7',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              color: '#1D1D1F',
              backgroundColor: '#FFFFFF',
            }}
            placeholder="Enter password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            backgroundColor: '#007AFF',
            color: '#FFFFFF',
            padding: '10px 12px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: submitButtonCursorStyle,
            opacity: submitButtonOpacity,
            marginTop: '8px',
          }}
        >
          {submitButtonLabelText}
        </button>
      </form>

      {errorMessageText && (
        <div
          style={{
            color: '#FF3B30',
            fontSize: '13px',
            marginTop: '16px',
            textAlign: 'center',
          }}
        >
          {errorMessageText}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px' }}>
        <Link to="/signup" style={{ color: '#007AFF', textDecoration: 'none' }}>
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  );
}
