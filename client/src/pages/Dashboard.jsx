import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyNotes, deleteNote, renewNote } from '../api/notes';
import RenewBanner from '../components/RenewBanner';

// Dashboard page component displaying the logged-in user's notes with delete and renewal actions.
// Step 1: Access authentication token and navigation hook.
// Step 2: Initialize state variables for user notes array, loading status, global error message, and per-row error messages object.
// Step 3: Fetch current user's notes from backend API endpoint on mount and poll every 30 seconds.
// Step 4: Handle note deletion action with window.confirm prompt and plain for loop list filtering.
// Step 5: Handle note renewal action and update note in state.
// Step 6: Process notes in a plain for loop to calculate expiry time window (expired vs 2-hour renewal window vs normal).
// Step 7: Render notes list or empty/error states.
export default function Dashboard() {
  const authContext = useAuth();
  const authenticationToken = authContext.token;

  const navigateHook = useNavigate();

  const userNotesState = useState([]);
  const userNotesArray = userNotesState[0];
  const setUserNotesArray = userNotesState[1];

  const isLoadingState = useState(true);
  const isNotesLoading = isLoadingState[0];
  const setIsNotesLoading = isLoadingState[1];

  const errorMessageState = useState(null);
  const errorMessageText = errorMessageState[0];
  const setErrorMessageText = errorMessageState[1];

  const rowErrorsState = useState({});
  const rowErrorsObject = rowErrorsState[0];
  const setRowErrorsObject = rowErrorsState[1];

  // Step 3: Fetch notes owned by current user
  async function fetchUserNotesFromApi() {
    try {
      const apiResponseData = await getMyNotes(authenticationToken);
      let fetchedNotesList = [];
      if (apiResponseData) {
        if (apiResponseData.notes) {
          fetchedNotesList = apiResponseData.notes;
        }
      }
      setUserNotesArray(fetchedNotesList);
      setErrorMessageText(null);
    } catch (errorObject) {
      console.error('Fetch my notes error:', errorObject);
      let extractedErrorMessage = 'Failed to load your notes';

      if (errorObject) {
        if (errorObject.response) {
          if (errorObject.response.data) {
            if (errorObject.response.data.message) {
              extractedErrorMessage = errorObject.response.data.message;
            }
          }
        }
      }

      setErrorMessageText(extractedErrorMessage);
    } finally {
      setIsNotesLoading(false);
    }
  }

  useEffect(function () {
    if (!authenticationToken) {
      return;
    }

    fetchUserNotesFromApi();

    const pollingIntervalId = setInterval(function () {
      fetchUserNotesFromApi();
    }, 30000);

    return function cleanupPolling() {
      clearInterval(pollingIntervalId);
    };
  }, [authenticationToken]);

  // Step 4: Handle note deletion with confirmation prompt and plain for loop filtering
  async function handleDeleteNote(targetNoteId) {
    const isUserConfirmed = window.confirm('Are you sure you want to delete this note?');
    if (!isUserConfirmed) {
      return;
    }

    try {
      await deleteNote(targetNoteId, authenticationToken);

      // Remove deleted note from state using a plain for loop instead of .filter
      const updatedNotesList = [];
      for (let index = 0; index < userNotesArray.length; index = index + 1) {
        const currentNote = userNotesArray[index];
        if (currentNote._id !== targetNoteId) {
          updatedNotesList.push(currentNote);
        }
      }
      setUserNotesArray(updatedNotesList);
    } catch (errorObject) {
      console.error('Delete note error:', errorObject);
      let deleteErrorMessage = 'Failed to delete note';

      if (errorObject) {
        if (errorObject.response) {
          if (errorObject.response.data) {
            if (errorObject.response.data.message) {
              deleteErrorMessage = errorObject.response.data.message;
            }
          }
        }
      }

      const updatedRowErrors = Object.assign({}, rowErrorsObject);
      updatedRowErrors[targetNoteId] = deleteErrorMessage;
      setRowErrorsObject(updatedRowErrors);
    }
  }

  // Step 5: Handle note renewal and update row in state using plain for loop
  async function handleRenewNote(targetNoteId) {
    try {
      const apiResponseData = await renewNote(targetNoteId, authenticationToken);
      if (apiResponseData) {
        if (apiResponseData.note) {
          const renewedNoteObject = apiResponseData.note;

          const updatedNotesList = [];
          for (let index = 0; index < userNotesArray.length; index = index + 1) {
            const currentNote = userNotesArray[index];
            if (currentNote._id === targetNoteId) {
              const mergedNoteObject = Object.assign({}, currentNote, renewedNoteObject);
              updatedNotesList.push(mergedNoteObject);
            } else {
              updatedNotesList.push(currentNote);
            }
          }
          setUserNotesArray(updatedNotesList);

          const updatedRowErrors = Object.assign({}, rowErrorsObject);
          updatedRowErrors[targetNoteId] = null;
          setRowErrorsObject(updatedRowErrors);
        }
      }
    } catch (errorObject) {
      console.error('Renew note error:', errorObject);
      let renewErrorMessage = 'Failed to renew note';

      if (errorObject) {
        if (errorObject.response) {
          if (errorObject.response.data) {
            if (errorObject.response.data.message) {
              renewErrorMessage = errorObject.response.data.message;
            }
          }
        }
      }

      const updatedRowErrors = Object.assign({}, rowErrorsObject);
      updatedRowErrors[targetNoteId] = renewErrorMessage;
      setRowErrorsObject(updatedRowErrors);
    }
  }

  // Step 6: Process user notes in a plain for loop to compute expiry math and render card components
  // Note Expiry Math Explanation:
  // - timeUntilExpiryInMs = expiresAt timestamp - current timestamp (Date.now())
  // - 2 hours in milliseconds = 2 * 60 * 60 * 1000 = 7,200,000 ms
  // - If timeUntilExpiryInMs <= 0: note has expired
  // - If 0 < timeUntilExpiryInMs <= 7,200,000: note is inside 2-hour renewal window (show RenewBanner)
  // - If timeUntilExpiryInMs > 7,200,000: note has normal active expiration time
  const renderedUserNoteItemComponents = [];

  for (let noteIndex = 0; noteIndex < userNotesArray.length; noteIndex = noteIndex + 1) {
    const singleNoteObject = userNotesArray[noteIndex];

    let timeUntilExpiryInMs = Infinity;
    if (singleNoteObject.expiresAt) {
      const expirationTimestampMs = new Date(singleNoteObject.expiresAt).getTime();
      const currentTimestampMs = Date.now();
      timeUntilExpiryInMs = expirationTimestampMs - currentTimestampMs;
    }

    let isNoteExpired = false;
    let isNoteInRenewalWindow = false;
    let isNormalActiveExpiry = false;

    if (!singleNoteObject.isPermanent) {
      if (timeUntilExpiryInMs <= 0) {
        isNoteExpired = true;
      } else if (timeUntilExpiryInMs <= 2 * 60 * 60 * 1000) {
        isNoteInRenewalWindow = true;
      } else {
        isNormalActiveExpiry = true;
      }
    }

    const noteEditPath = '/editor/' + singleNoteObject._id;
    const noteRowErrorMessage = rowErrorsObject[singleNoteObject._id];

    // Helper functions for onClick button handlers to avoid inline arrow functions
    function onClickDeleteButton() {
      handleDeleteNote(singleNoteObject._id);
    }

    let formattedExpirationString = '';
    if (singleNoteObject.expiresAt) {
      formattedExpirationString = new Date(singleNoteObject.expiresAt).toLocaleString();
    }

    renderedUserNoteItemComponents.push(
      <div
        key={singleNoteObject._id}
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E7',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        {/* Note Row Top Line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to={noteEditPath}
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1D1D1F',
                textDecoration: 'none',
              }}
            >
              {singleNoteObject.title}
            </Link>

            {/* Visibility Tag */}
            <span
              style={{
                fontSize: '12px',
                color: '#6E6E73',
                backgroundColor: '#F5F5F7',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'capitalize',
              }}
            >
              {singleNoteObject.visibility}
            </span>
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onClickDeleteButton}
            style={{
              background: 'none',
              color: '#FF3B30',
              border: '1px solid #FF3B30',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>

        {/* Expiry / Permanent Info Status Text */}
        {singleNoteObject.isPermanent && (
          <div style={{ fontSize: '13px', color: '#6E6E73', marginTop: '6px' }}>
            Permanent
          </div>
        )}

        {!singleNoteObject.isPermanent && isNormalActiveExpiry && (
          <div style={{ fontSize: '13px', color: '#6E6E73', marginTop: '6px' }}>
            Expires {formattedExpirationString}
          </div>
        )}

        {!singleNoteObject.isPermanent && isNoteExpired && (
          <div style={{ fontSize: '13px', color: '#FF3B30', marginTop: '6px' }}>
            Expired — will be removed shortly
          </div>
        )}

        {/* Renewal Banner if within 2-hour window */}
        {isNoteInRenewalWindow && (
          <RenewBanner note={singleNoteObject} onRenew={handleRenewNote} />
        )}

        {/* Row Error Message */}
        {noteRowErrorMessage && (
          <div style={{ color: '#FF3B30', fontSize: '13px', marginTop: '6px' }}>
            {noteRowErrorMessage}
          </div>
        )}
      </div>
    );
  }

  // Step 7: Render Dashboard UI
  return (
    <div
      style={{
        paddingTop: '72px',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: '40px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <h1
          style={{
            color: '#1D1D1F',
            fontSize: '28px',
            fontWeight: 700,
          }}
        >
          My Notes
        </h1>

        <Link
          to="/editor"
          style={{
            backgroundColor: '#007AFF',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          + New Note
        </Link>
      </div>

      {/* Loading state indicator */}
      {isNotesLoading && (
        <div
          style={{
            textAlign: 'center',
            paddingTop: '40px',
            color: '#6E6E73',
            fontSize: '15px',
          }}
        >
          Loading your notes...
        </div>
      )}

      {/* Error state indicator */}
      {!isNotesLoading && errorMessageText && (
        <div
          style={{
            textAlign: 'center',
            paddingTop: '40px',
            color: '#FF3B30',
            fontSize: '15px',
          }}
        >
          <p>{errorMessageText}</p>
          <button
            type="button"
            onClick={fetchUserNotesFromApi}
            style={{
              marginTop: '12px',
              backgroundColor: '#007AFF',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty notes state */}
      {!isNotesLoading && !errorMessageText && userNotesArray.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            paddingTop: '40px',
            color: '#6E6E73',
            fontSize: '15px',
          }}
        >
          You don't have any notes yet.{' '}
          <Link to="/editor" style={{ color: '#007AFF', textDecoration: 'none' }}>
            Create one now!
          </Link>
        </div>
      )}

      {/* User Notes List */}
      {!isNotesLoading && !errorMessageText && userNotesArray.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {renderedUserNoteItemComponents}
        </div>
      )}
    </div>
  );
}