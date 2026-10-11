import React, { useState, useEffect } from 'react';

// This banner component shows a live countdown for expiring notes and a button to renew them.
// Step 1: Extract props and check if the banner should be visible.
// Step 2: Set up state for remaining time and renewal status.
// Step 3: Run an effect to update remaining time every second.
// Step 4: Format remaining milliseconds into a human-readable countdown string.
// Step 5: Handle button click to invoke renewal callback.
export default function RenewBanner(props) {
  const noteObject = props.note;
  const onRenewCallback = props.onRenew;

  const [timeLeft, setTimeLeft] = useState(0);
  const [isRenewing, setIsRenewing] = useState(false);

  // Return null if note is missing, permanent, or has no expiration date
  if (!noteObject) {
    return null;
  }
  if (noteObject.isPermanent) {
    return null;
  }
  if (!noteObject.expiresAt) {
    return null;
  }

  // Step 3: Calculate remaining milliseconds until note expiration
  function calculateRemainingMilliseconds() {
    if (!noteObject.expiresAt) {
      return 0;
    }
    const expirationTimeInMs = new Date(noteObject.expiresAt).getTime();
    const currentTimeInMs = Date.now();
    const differenceInMs = expirationTimeInMs - currentTimeInMs;

    if (differenceInMs < 0) {
      return 0;
    }
    return differenceInMs;
  }

  // Step 3: Set up timer interval on mount
  useEffect(function () {
    const initialTimeLeft = calculateRemainingMilliseconds();
    setTimeLeft(initialTimeLeft);

    const timerIntervalId = setInterval(function () {
      const remainingMs = calculateRemainingMilliseconds();
      setTimeLeft(remainingMs);
    }, 1000);

    return function cleanupTimer() {
      clearInterval(timerIntervalId);
    };
  }, [noteObject.expiresAt]);

  // Step 4: Format time remaining into hours, minutes, and seconds
  function formatCountdown(milliseconds) {
    if (milliseconds <= 0) {
      return 'Expired';
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return hours + 'h ' + minutes + 'm ' + seconds + 's remaining';
    }
    return minutes + 'm ' + seconds + 's remaining';
  }

  // Step 5: Handle renew button click
  async function handleRenewClick() {
    setIsRenewing(true);
    try {
      if (onRenewCallback) {
        await onRenewCallback(noteObject._id);
      }
    } finally {
      setIsRenewing(false);
    }
  }

  const isNoteExpired = timeLeft <= 0;

  // Determine styling based on expiration and renewal state without ternaries
  let countdownTextColor = '#1D1D1F';
  if (isNoteExpired) {
    countdownTextColor = '#FF3B30';
  }

  let buttonBackgroundColor = '#007AFF';
  if (isNoteExpired) {
    buttonBackgroundColor = '#E5E5E7';
  }

  let buttonTextColor = '#FFFFFF';
  if (isNoteExpired) {
    buttonTextColor = '#6E6E73';
  }

  let buttonCursorStyle = 'pointer';
  if (isNoteExpired || isRenewing) {
    buttonCursorStyle = 'not-allowed';
  }

  let buttonOpacity = 1;
  if (isRenewing) {
    buttonOpacity = 0.7;
  }

  let buttonLabelText = 'Renew';
  if (isRenewing) {
    buttonLabelText = 'Renewing...';
  }

  return (
    <div
      style={{
        backgroundColor: '#F5F5F7',
        border: '1px solid #E5E5E7',
        borderRadius: '6px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '10px',
        fontSize: '13px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      <span style={{ color: countdownTextColor, fontWeight: 500 }}>
        ⏰ Renewal Window: {formatCountdown(timeLeft)}
      </span>

      <button
        type="button"
        onClick={handleRenewClick}
        disabled={isNoteExpired || isRenewing}
        style={{
          backgroundColor: buttonBackgroundColor,
          color: buttonTextColor,
          border: 'none',
          borderRadius: '4px',
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: buttonCursorStyle,
          opacity: buttonOpacity,
        }}
      >
        {buttonLabelText}
      </button>
    </div>
  );
}
