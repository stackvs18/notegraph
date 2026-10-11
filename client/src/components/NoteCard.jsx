import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// This component renders a card for a single note, displaying title, author, admin badge, tags, and expiry badge.
// Step 1: Extract note prop and initialize hover state.
// Step 2: Calculate expiry text based on expiresAt date.
// Step 3: Render tags array using a plain for loop.
// Step 4: Render card container and link to note detail page.
export default function NoteCard(props) {
  const noteObject = props.note;

  const [isHovered, setIsHovered] = useState(false);

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    setIsHovered(false);
  }

  // Step 2: Calculate expiry time string
  function getExpiryText() {
    if (!noteObject) {
      return null;
    }
    if (noteObject.isPermanent) {
      return null;
    }
    if (!noteObject.expiresAt) {
      return null;
    }

    const expirationDate = new Date(noteObject.expiresAt);
    const currentDate = new Date();
    const differenceInMs = expirationDate - currentDate;

    if (differenceInMs <= 0) {
      return 'Expired';
    }

    const differenceInHours = Math.floor(differenceInMs / (1000 * 60 * 60));
    const differenceInMinutes = Math.floor((differenceInMs % (1000 * 60 * 60)) / (1000 * 60));

    if (differenceInHours > 0) {
      return 'Expires in ' + differenceInHours + 'h ' + differenceInMinutes + 'm';
    }
    return 'Expires in ' + differenceInMinutes + 'm';
  }

  const expiryText = getExpiryText();

  // Step 3: Build tag elements array using a plain for loop instead of .map
  const renderedTagChips = [];
  if (noteObject) {
    if (noteObject.tags) {
      if (Array.isArray(noteObject.tags)) {
        for (let tagIndex = 0; tagIndex < noteObject.tags.length; tagIndex = tagIndex + 1) {
          const tagString = noteObject.tags[tagIndex];
          renderedTagChips.push(
            <span
              key={tagIndex}
              style={{
                border: '1px solid #E5E5E7',
                color: '#6E6E73',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                backgroundColor: '#FFFFFF',
              }}
            >
              #{tagString}
            </span>
          );
        }
      }
    }
  }

  // Determine card border style without ternaries
  let cardBorderStyle = '1px solid #E5E5E7';
  if (isHovered) {
    cardBorderStyle = '1px solid #007AFF';
  }

  // Determine slug fallback
  let noteSlugString = 'note';
  if (noteObject) {
    if (noteObject.slug) {
      noteSlugString = noteObject.slug;
    }
  }

  let noteNanoidString = '';
  if (noteObject) {
    if (noteObject.nanoid) {
      noteNanoidString = noteObject.nanoid;
    }
  }

  let isAdminUser = false;
  if (noteObject) {
    if (noteObject.authorRole === 'admin' || noteObject.authorRole === 'superadmin') {
      isAdminUser = true;
    }
  }

  const destinationPath = '/notes/' + noteSlugString + '/' + noteNanoidString;

  return (
    <Link
      to={destinationPath}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        border: cardBorderStyle,
        borderRadius: '8px',
        padding: '16px',
        textDecoration: 'none',
        transition: 'border-color 0.2s ease',
        cursor: 'pointer',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      <div>
        {/* Note Title */}
        <h3
          style={{
            color: '#1D1D1F',
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '6px',
            wordBreak: 'break-word',
          }}
        >
          {noteObject ? noteObject.title : ''}
        </h3>

        {/* Author Name and Admin Badge */}
        <div style={{ fontSize: '13px', color: '#6E6E73', marginBottom: '12px' }}>
          By {noteObject ? noteObject.authorName : ''}
          {isAdminUser && (
            <span
              style={{
                color: '#007AFF',
                fontWeight: 600,
                marginLeft: '6px',
                fontSize: '12px',
              }}
            >
              Admin
            </span>
          )}
        </div>

        {/* Rendered Tags List */}
        {renderedTagChips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {renderedTagChips}
          </div>
        )}
      </div>

      {/* Expiry Badge */}
      {expiryText && (
        <div
          style={{
            fontSize: '12px',
            color: '#6E6E73',
            marginTop: '8px',
            borderTop: '1px solid #F2F2F7',
            paddingTop: '8px',
          }}
        >
          {expiryText}
        </div>
      )}
    </Link>
  );
}
