import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Signup page component for user registration.
// Step 1: Initialize form inputs state (username, email, password, submitting flag, error message).
// Step 2: Handle form submission to validate inputs and invoke registerUser API.
// Step 3: Redirect to home page on success or display error message on failure.
export default function Signup() {
  const usernameState = useState('');
  const usernameInput = usernameState[0];
  const setUsernameInput = usernameState[1];

  const emailState = useState('');
  const emailInput = emailState[0];
  const setEmailInput = emailState[1];

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
  const registerUserFunction = authContext.registerUser;

  const navigateHook = useNavigate();

  function handleUsernameChange(eventObject) {
    setUsernameInput(eventObject.target.value);
  }

  function handleEmailChange(eventObject) {
    setEmailInput(eventObject.target.value);
  }

  function handlePasswordChange(eventObject) {
    setPasswordInput(eventObject.target.value);
  }

  // Step 2: Handle form submit action
  async function handleSubmit(eventObject) {
    eventObject.preventDefault();
    setErrorMessageText('');

    const trimmedUsername = usernameInput.trim();
    const trimmedEmail = emailInput.trim();

    if (!trimmedUsername || !trimmedEmail || !passwordInput) {
      setErrorMessageText('All fields are required');
      return;
    }

    if (passwordInput.length < 6) {
      setErrorMessageText('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    const registerResultObject = await registerUserFunction(trimmedUsername, trimmedEmail, passwordInput);
    setIsSubmitting(false);

    // Step 3: Process registration result
    if (registerResultObject) {
      if (registerResultObject.success) {
        navigateHook('/');
      } else {
        let failureMessage = 'Registration failed';
        if (registerResultObject.message) {
          failureMessage = registerResultObject.message;
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

  let submitButtonLabelText = 'Sign up';
  if (isSubmitting) {
    submitButtonLabelText = 'Signing up...';
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
        Sign up
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="signup-username"
            style={{ display: 'block', fontSize: '13px', color: '#6E6E73', marginBottom: '6px' }}
          >
            Username
          </label>
          <input
            id="signup-username"
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
            placeholder="Choose username"
            required
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            style={{ display: 'block', fontSize: '13px', color: '#6E6E73', marginBottom: '6px' }}
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={emailInput}
            onChange={handleEmailChange}
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
            placeholder="Enter email address"
            required
          />
        </div>

        <div>
          <label
            htmlFor="signup-password"
            style={{ display: 'block', fontSize: '13px', color: '#6E6E73', marginBottom: '6px' }}
          >
            Password
          </label>
          <input
            id="signup-password"
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
            placeholder="At least 6 characters"
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
        <Link to="/login" style={{ color: '#007AFF', textDecoration: 'none' }}>
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}
