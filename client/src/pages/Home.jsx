import React, { useState, useEffect } from 'react';
import { getPublicNotes } from '../api/notes';
import NoteCard from '../components/NoteCard';

// Home page component that fetches and displays a grid of public notes.
// Step 1: Initialize component state for public notes, loading status, and error message.
// Step 2: Fetch public notes from the API on mount.
// Step 3: Convert notes array into NoteCard components using a plain for loop.
// Step 4: Render loading, error, empty, or grid view depending on state.
export default function Home() {
  const publicNotesState = useState([]);
  const publicNotesArray = publicNotesState[0];
  const setPublicNotesArray = publicNotesState[1];

  const isLoadingState = useState(true);
  const isNotesLoading = isLoadingState[0];
  const setIsNotesLoading = isLoadingState[1];

  const errorMessageState = useState(null);
  const errorMessageText = errorMessageState[0];
  const setErrorMessageText = errorMessageState[1];

  // Step 2: Fetch public notes from server API endpoint
  async function fetchPublicNotesFromApi() {
    setIsNotesLoading(true);
    setErrorMessageText(null);

    try {
      const apiResponseData = await getPublicNotes();
      let fetchedNotesList = [];
      if (apiResponseData) {
        if (apiResponseData.notes) {
          fetchedNotesList = apiResponseData.notes;
        }
      }
      setPublicNotesArray(fetchedNotesList);
    } catch (errorObject) {
      console.error('Fetch public notes error:', errorObject);
      let extractedErrorMessage = 'Failed to load public notes';

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
    fetchPublicNotesFromApi();
  }, []);

  // Step 3: Build grid items array using a plain for loop instead of .map
  const renderedNoteCardComponents = [];
  for (let noteIndex = 0; noteIndex < publicNotesArray.length; noteIndex = noteIndex + 1) {
    const singleNoteObject = publicNotesArray[noteIndex];
    let uniqueKeyString = singleNoteObject.nanoid;
    if (singleNoteObject._id) {
      uniqueKeyString = singleNoteObject._id;
    }

    renderedNoteCardComponents.push(
      <NoteCard key={uniqueKeyString} note={singleNoteObject} />
    );
  }

  // Step 4: Render page content based on step 1-3 state checks
  return (
    <div
      style={{
        paddingTop: '72px',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: '40px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          color: '#1D1D1F',
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '24px',
        }}
      >
        Public Notes
      </h1>

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
          Loading notes...
        </div>
      )}

      {/* Error state with retry option */}
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
            onClick={fetchPublicNotesFromApi}
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
      {!isNotesLoading && !errorMessageText && publicNotesArray.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            paddingTop: '40px',
            color: '#6E6E73',
            fontSize: '15px',
          }}
        >
          No public notes yet.
        </div>
      )}

      {/* Notes Grid Display */}
      {!isNotesLoading && !errorMessageText && publicNotesArray.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {renderedNoteCardComponents}
        </div>
      )}
    </div>
  );
}
