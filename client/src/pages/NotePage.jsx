import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPublicNoteByNanoid } from '../api/notes';
import MarkdownPreview from '../components/MarkdownPreview';

// Page component for viewing a single public note by its unique nanoid string.
// Step 1: Read route parameters and authentication context.
// Step 2: Initialize state variables for note object, loading status, expired status (HTTP 410), and not-found status (HTTP 404).
// Step 3: Fetch note data from API on component mount / nanoid change.
// Step 4: Handle state checks (loading state vs. 410 expired state vs. 404 not found state).
// Step 5: Render note title, author name, admin badge, tags, and rendered markdown body.
export default function NotePage() {
  const routeParameters = useParams();
  const noteNanoidString = routeParameters.nanoid;

  const authContext = useAuth();
  const currentUser = authContext.user;

  const noteObjectState = useState(null);
  const currentNoteObject = noteObjectState[0];
  const setCurrentNoteObject = noteObjectState[1];

  const isLoadingState = useState(true);
  const isNoteLoading = isLoadingState[0];
  const setIsNoteLoading = isLoadingState[1];

  const isExpiredState = useState(false);
  const isNoteExpired = isExpiredState[0];
  const setIsNoteExpired = isExpiredState[1];

  const isNotFoundState = useState(false);
  const isNoteNotFound = isNotFoundState[0];
  const setIsNoteNotFound = isNotFoundState[1];

  // Step 3: Fetch public note by nanoid from backend server
  useEffect(function () {
    async function fetchPublicNoteByNanoidFromApi() {
      setIsNoteLoading(true);
      setIsNoteExpired(false);
      setIsNoteNotFound(false);
      setCurrentNoteObject(null);

      try {
        const apiResponseData = await getPublicNoteByNanoid(noteNanoidString);
        let fetchedNoteData = null;
        if (apiResponseData) {
          if (apiResponseData.note) {
            fetchedNoteData = apiResponseData.note;
          }
        }
        setCurrentNoteObject(fetchedNoteData);
      } catch (errorObject) {
        console.error('Fetch public note error:', errorObject);

        // Check HTTP status code for 410 (Expired) vs 404 (Not Found / Server Error)
        let httpStatusCode = 0;
        if (errorObject) {
          if (errorObject.response) {
            if (errorObject.response.status) {
              httpStatusCode = errorObject.response.status;
            }
          }
        }

        if (httpStatusCode === 410) {
          setIsNoteExpired(true);
        } else {
          setIsNoteNotFound(true);
        }
      } finally {
        setIsNoteLoading(false);
      }
    }

    if (noteNanoidString) {
      fetchPublicNoteByNanoidFromApi();
    }
  }, [noteNanoidString]);

  // Determine if the logged in user can edit this note
  let loggedInUserId = null;
  if (currentUser) {
    if (currentUser.id) {
      loggedInUserId = currentUser.id;
    } else if (currentUser._id) {
      loggedInUserId = currentUser._id;
    } else if (currentUser.userId) {
      loggedInUserId = currentUser.userId;
    }
  }

  let isUserAuthorizedToEdit = false;
  if (currentUser) {
    if (currentNoteObject) {
      if (loggedInUserId && loggedInUserId === currentNoteObject.authorId) {
        isUserAuthorizedToEdit = true;
      } else if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        isUserAuthorizedToEdit = true;
      }
    }
  }

  // Step 4: Check state step 1 - Loading
  if (isNoteLoading) {
    return (
      <div
        style={{
          paddingTop: '100px',
          textAlign: 'center',
          color: '#6E6E73',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
          fontSize: '15px',
        }}
      >
        Loading...
      </div>
    );
  }

  // Step 4: Check state step 2 - Expired (HTTP 410)
  if (isNoteExpired) {
    return (
      <div
        style={{
          paddingTop: '100px',
          textAlign: 'center',
          color: '#6E6E73',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
          fontSize: '15px',
        }}
      >
        <p>This note has expired and is no longer available.</p>
        <Link
          to="/"
          style={{
            color: '#007AFF',
            textDecoration: 'none',
            display: 'inline-block',
            marginTop: '12px',
            fontSize: '14px',
          }}
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Step 4: Check state step 3 - Not Found (HTTP 404)
  if (isNoteNotFound || !currentNoteObject) {
    return (
      <div
        style={{
          paddingTop: '100px',
          textAlign: 'center',
          color: '#6E6E73',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
          fontSize: '15px',
        }}
      >
        <p>Note not found.</p>
        <Link
          to="/"
          style={{
            color: '#007AFF',
            textDecoration: 'none',
            display: 'inline-block',
            marginTop: '12px',
            fontSize: '14px',
          }}
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Build tags chips array using a plain for loop instead of .map
  const renderedTagElements = [];
  if (currentNoteObject.tags) {
    if (Array.isArray(currentNoteObject.tags)) {
      for (let tagIndex = 0; tagIndex < currentNoteObject.tags.length; tagIndex = tagIndex + 1) {
        const tagTextString = currentNoteObject.tags[tagIndex];
        renderedTagElements.push(
          <span
            key={tagIndex}
            style={{
              border: '1px solid #E5E5E7',
              color: '#6E6E73',
              borderRadius: '12px',
              padding: '2px 10px',
              fontSize: '12px',
              backgroundColor: '#FFFFFF',
            }}
          >
            #{tagTextString}
          </span>
        );
      }
    }
  }

  let isAuthorAdminRole = false;
  if (currentNoteObject.authorRole === 'admin' || currentNoteObject.authorRole === 'superadmin') {
    isAuthorAdminRole = true;
  }

  let noteBodyMarkdownText = '';
  if (currentNoteObject.body) {
    noteBodyMarkdownText = currentNoteObject.body;
  }

  const editDestinationUrl = '/editor/' + currentNoteObject._id;

  // Step 5: Render note details
  return (
    <div
      style={{
        paddingTop: '72px',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '12px',
        }}
      >
        <h1
          style={{
            color: '#1D1D1F',
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: '1.2',
            wordBreak: 'break-word',
          }}
        >
          {currentNoteObject.title}
        </h1>

        {isUserAuthorizedToEdit && (
          <Link
            to={editDestinationUrl}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#007AFF',
              border: '1px solid #007AFF',
              padding: '6px 14px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              flexShrink: 0,
              marginTop: '4px',
            }}
          >
            Edit
          </Link>
        )}
      </div>

      {/* Author & Role line */}
      <div style={{ fontSize: '14px', color: '#6E6E73', marginBottom: '16px' }}>
        By {currentNoteObject.authorName}
        {isAuthorAdminRole && (
          <span
            style={{
              color: '#007AFF',
              fontWeight: 600,
              marginLeft: '6px',
              fontSize: '13px',
            }}
          >
            Admin
          </span>
        )}
      </div>

      {/* Tags Chips */}
      {renderedTagElements.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
          {renderedTagElements}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #E5E5E7', marginBottom: '24px' }} />

      {/* Markdown Body Preview */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
        <MarkdownPreview markdown={noteBodyMarkdownText} />
      </div>
    </div>
  );
}
