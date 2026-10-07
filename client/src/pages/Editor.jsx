import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNoteById, createNote, updateNote } from '../api/notes';
import MarkdownPreview from '../components/MarkdownPreview';

// Editor page component for creating new notes or editing existing ones with live markdown preview.
// Step 1: Access router parameters, navigate hook, and authentication token.
// Step 2: Initialize form state (title, body, visibility, saving status, error messages, note data).
// Step 3: Fetch note data if editing an existing note (id in URL), or reset fields if creating.
// Step 4: Handle save note action (create vs update API calls).
// Step 5: Handle text file import using FileReader.
// Step 6: Render top toolbar controls and split-pane text editor with side-by-side MarkdownPreview.
export default function Editor() {
  const routeParameters = useParams();
  const noteIdFromUrl = routeParameters.id;

  const navigateHook = useNavigate();

  const authContext = useAuth();
  const authenticationToken = authContext.token;

  const titleState = useState('');
  const noteTitle = titleState[0];
  const setNoteTitle = titleState[1];

  const bodyState = useState('');
  const noteBody = bodyState[0];
  const setNoteBody = bodyState[1];

  const visibilityState = useState('private');
  const noteVisibility = visibilityState[0];
  const setNoteVisibility = visibilityState[1];

  const isSavingState = useState(false);
  const isSaving = isSavingState[0];
  const setIsSaving = isSavingState[1];

  const saveStatusState = useState('');
  const saveStatusText = saveStatusState[0];
  const setSaveStatusText = saveStatusState[1];

  const errorMessageState = useState('');
  const errorMessageText = errorMessageState[0];
  const setErrorMessageText = errorMessageState[1];

  const noteDataState = useState(null);
  const currentNoteData = noteDataState[0];
  const setCurrentNoteData = noteDataState[1];

  const copiedState = useState(false);
  const isLinkCopied = copiedState[0];
  const setIsLinkCopied = copiedState[1];

  // Tag state for the note
  const noteTagsState = useState([]);
  const noteTags = noteTagsState[0];
  const setNoteTags = noteTagsState[1];

  const tagInputValueState = useState('');
  const tagInputValue = tagInputValueState[0];
  const setTagInputValue = tagInputValueState[1];

  const fileInputDOMRef = useRef(null);

  // Step 3: Load existing note for editing, or reset form for new note creation
  useEffect(function () {
    async function loadNoteDataForEditing() {
      try {
        const apiResponseData = await getNoteById(noteIdFromUrl, authenticationToken);
        if (apiResponseData) {
          if (apiResponseData.note) {
            setNoteTitle(apiResponseData.note.title);

            let existingBody = '';
            if (apiResponseData.note.body) {
              existingBody = apiResponseData.note.body;
            }
            setNoteBody(existingBody);

            let existingVisibility = 'private';
            if (apiResponseData.note.visibility) {
              existingVisibility = apiResponseData.note.visibility;
            }
            setNoteVisibility(existingVisibility);

            // Prefill tags from the existing note
            var existingTags = [];
            if (apiResponseData.note.tags !== null && apiResponseData.note.tags !== undefined) {
              existingTags = apiResponseData.note.tags;
            }
            setNoteTags(existingTags);

            setCurrentNoteData(apiResponseData.note);
          }
        }
      } catch (errorObject) {
        console.error('Fetch note error:', errorObject);
        navigateHook('/dashboard');
      }
    }

    if (noteIdFromUrl) {
      loadNoteDataForEditing();
    } else {
      setNoteTitle('');
      setNoteBody('');
      setNoteVisibility('private');
      setNoteTags([]);
      setTagInputValue('');
      setCurrentNoteData(null);
    }
  }, [noteIdFromUrl, authenticationToken, navigateHook]);

  // Step 4: Handle note saving to backend API
  async function handleSaveNote() {
    if (!noteTitle.trim()) {
      setErrorMessageText('Title is required');
      return;
    }

    setErrorMessageText('');
    setIsSaving(true);

    try {
      if (noteIdFromUrl) {
        // Update existing note
        const updatePayload = {
          title: noteTitle,
          body: noteBody,
          visibility: noteVisibility,
          tags: noteTags
        };
        const updateResponseData = await updateNote(noteIdFromUrl, updatePayload, authenticationToken);

        setCurrentNoteData(updateResponseData.note);
        setSaveStatusText('saved');

        setTimeout(function () {
          setSaveStatusText('');
        }, 2000);
      } else {
        // Create new note
        const createPayload = {
          title: noteTitle,
          body: noteBody,
          visibility: noteVisibility,
          tags: noteTags
        };
        const createResponseData = await createNote(createPayload, authenticationToken);

        setCurrentNoteData(createResponseData.note);
        setSaveStatusText('saved');

        setTimeout(function () {
          setSaveStatusText('');
        }, 2000);

        const newNoteId = createResponseData.note._id;
        navigateHook('/editor/' + newNoteId, { replace: true });
      }
    } catch (errorObject) {
      console.error('Save note error:', errorObject);
      let saveErrorMessage = 'Failed to save note';

      if (errorObject) {
        if (errorObject.response) {
          if (errorObject.response.data) {
            if (errorObject.response.data.message) {
              saveErrorMessage = errorObject.response.data.message;
            }
          }
        }
      }

      setErrorMessageText(saveErrorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  // Step 5: Handle text file import
  function handleFileImport(eventObject) {
    if (!eventObject) return;
    if (!eventObject.target) return;
    if (!eventObject.target.files) return;

    const selectedFile = eventObject.target.files[0];
    if (!selectedFile) return;

    const fileReaderInstance = new FileReader();
    fileReaderInstance.onload = function (fileLoadEvent) {
      if (!fileLoadEvent) return;
      if (!fileLoadEvent.target) return;

      const fileTextContent = fileLoadEvent.target.result;
      if (typeof fileTextContent === 'string') {
        setNoteBody(function (previousBodyText) {
          if (previousBodyText) {
            return previousBodyText + '\n\n' + fileTextContent;
          }
          return fileTextContent;
        });
      }
    };

    fileReaderInstance.readAsText(selectedFile);
    eventObject.target.value = '';
  }

  function handleImportButtonClick() {
    if (fileInputDOMRef.current) {
      fileInputDOMRef.current.click();
    }
  }

  function handleSetPrivateVisibility() {
    setNoteVisibility('private');
  }

  function handleSetPublicVisibility() {
    setNoteVisibility('public');
  }

  // Determine shareable public link
  let publicShareableUrl = '';
  if (currentNoteData) {
    if (currentNoteData.slug) {
      if (currentNoteData.nanoid) {
        publicShareableUrl = window.location.origin + '/notes/' + currentNoteData.slug + '/' + currentNoteData.nanoid;
      }
    }
  }

  function handleCopyPublicLink() {
    if (!publicShareableUrl) return;
    navigator.clipboard.writeText(publicShareableUrl);
    setIsLinkCopied(true);
    setTimeout(function () {
      setIsLinkCopied(false);
    }, 1500);
  }

  function handleTitleChange(eventObject) {
    setNoteTitle(eventObject.target.value);
  }

  function handleBodyChange(eventObject) {
    setNoteBody(eventObject.target.value);
  }

  // Tag input change handler
  function handleTagInputChange(eventObject) {
    setTagInputValue(eventObject.target.value);
  }

  // Add a tag when user presses Enter or clicks the Add button
  function handleAddTag() {
    var trimmedTag = tagInputValue.trim().toLowerCase();

    // Don't add empty tags
    if (trimmedTag === '') {
      return;
    }

    // Check if the tag already exists using a plain for loop
    var alreadyExists = false;
    for (var tagIdx = 0; tagIdx < noteTags.length; tagIdx = tagIdx + 1) {
      if (noteTags[tagIdx] === trimmedTag) {
        alreadyExists = true;
        break;
      }
    }

    if (alreadyExists === true) {
      setTagInputValue('');
      return;
    }

    // Build a new tags array with the new tag appended
    var updatedTagsList = [];
    for (var copyIdx = 0; copyIdx < noteTags.length; copyIdx = copyIdx + 1) {
      updatedTagsList.push(noteTags[copyIdx]);
    }
    updatedTagsList.push(trimmedTag);

    setNoteTags(updatedTagsList);
    setTagInputValue('');
  }

  // Handle Enter key press in the tag input
  function handleTagInputKeyDown(eventObject) {
    if (eventObject.key === 'Enter') {
      eventObject.preventDefault();
      handleAddTag();
    }
  }

  // Remove a tag by its index
  function handleRemoveTag(tagIndexToRemove) {
    var updatedTagsList = [];
    for (var tagIdx = 0; tagIdx < noteTags.length; tagIdx = tagIdx + 1) {
      if (tagIdx !== tagIndexToRemove) {
        updatedTagsList.push(noteTags[tagIdx]);
      }
    }
    setNoteTags(updatedTagsList);
  }

  // Compute button styling and labels without ternaries
  let privateButtonBackgroundColor = '#FFFFFF';
  let privateButtonTextColor = '#6E6E73';
  if (noteVisibility === 'private') {
    privateButtonBackgroundColor = '#007AFF';
    privateButtonTextColor = '#FFFFFF';
  }

  let publicButtonBackgroundColor = '#FFFFFF';
  let publicButtonTextColor = '#6E6E73';
  if (noteVisibility === 'public') {
    publicButtonBackgroundColor = '#007AFF';
    publicButtonTextColor = '#FFFFFF';
  }

  let saveButtonBackgroundColor = '#007AFF';
  if (saveStatusText === 'saved') {
    saveButtonBackgroundColor = '#34C759';
  }

  let saveButtonLabelText = 'Save Note';
  if (isSaving) {
    saveButtonLabelText = 'Saving...';
  } else if (saveStatusText === 'saved') {
    saveButtonLabelText = 'Saved ✓';
  }

  let saveButtonCursorStyle = 'pointer';
  if (isSaving) {
    saveButtonCursorStyle = 'not-allowed';
  }

  let saveButtonOpacity = 1;
  if (isSaving) {
    saveButtonOpacity = 0.7;
  }

  let copyButtonTextColor = '#007AFF';
  let copyButtonLabelText = 'Copy link';
  if (isLinkCopied) {
    copyButtonTextColor = '#34C759';
    copyButtonLabelText = 'Copied!';
  }

  let isPublicLinkVisible = false;
  if (currentNoteData) {
    if (currentNoteData.visibility === 'public') {
      if (publicShareableUrl) {
        isPublicLinkVisible = true;
      }
    }
  }

  return (
    <div
      style={{
        paddingTop: '52px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* Hidden File Input for Import .txt */}
      <input
        type="file"
        ref={fileInputDOMRef}
        accept=".txt"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />

      {/* TOP BAR */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #E5E5E7',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#FAFAFA',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Title Input */}
          <input
            type="text"
            value={noteTitle}
            onChange={handleTitleChange}
            placeholder="Note title..."
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '24px',
              fontWeight: 700,
              color: '#1D1D1F',
              outline: 'none',
              width: '100%',
            }}
          />

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* Import .txt button */}
            <button
              type="button"
              onClick={handleImportButtonClick}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1D1D1F',
                border: '1px solid #E5E5E7',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Import .txt
            </button>

            {/* Private | Public Toggle */}
            <div
              style={{
                display: 'flex',
                border: '1px solid #E5E5E7',
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
              }}
            >
              <button
                type="button"
                onClick={handleSetPrivateVisibility}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: privateButtonBackgroundColor,
                  color: privateButtonTextColor,
                }}
              >
                Private
              </button>
              <button
                type="button"
                onClick={handleSetPublicVisibility}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: publicButtonBackgroundColor,
                  color: publicButtonTextColor,
                }}
              >
                Public
              </button>
            </div>

            {/* Save Note Button */}
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={isSaving}
              style={{
                backgroundColor: saveButtonBackgroundColor,
                color: '#FFFFFF',
                padding: '6px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saveButtonCursorStyle,
                opacity: saveButtonOpacity,
                transition: 'background-color 0.2s ease',
              }}
            >
              {saveButtonLabelText}
            </button>
          </div>
        </div>

        {/* Tags Input Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#6E6E73' }}>Tags:</span>
          <input
            type="text"
            value={tagInputValue}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Add a tag and press Enter"
            style={{
              border: '1px solid #E5E5E7',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '13px',
              outline: 'none',
              color: '#1D1D1F',
              width: '180px',
              backgroundColor: '#FFFFFF',
            }}
          />
          <button
            type="button"
            onClick={handleAddTag}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#007AFF',
              border: '1px solid #E5E5E7',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>

        {/* Tag Chips */}
        {noteTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(function () {
              var chipElements = [];
              for (var chipIdx = 0; chipIdx < noteTags.length; chipIdx = chipIdx + 1) {
                // We need a closure to capture the correct index for the onClick
                (function (capturedIndex) {
                  chipElements.push(
                    <span
                      key={noteTags[capturedIndex]}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        border: '1px solid #E5E5E7',
                        borderRadius: '999px',
                        fontSize: '12px',
                        color: '#6E6E73',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {noteTags[capturedIndex]}
                      <span
                        onClick={function () { handleRemoveTag(capturedIndex); }}
                        style={{
                          cursor: 'pointer',
                          color: '#8E8E93',
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: 1,
                          marginLeft: '2px',
                        }}
                      >
                        ×
                      </span>
                    </span>
                  );
                })(chipIdx);
              }
              return chipElements;
            })()}
          </div>
        )}
        {errorMessageText && (
          <div style={{ color: '#FF3B30', fontSize: '13px', marginTop: '4px' }}>
            {errorMessageText}
          </div>
        )}

        {/* SHARE URL BAR */}
        {isPublicLinkVisible && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F2F2F7',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              marginTop: '4px',
            }}
          >
            <span style={{ color: '#1D1D1F', wordBreak: 'break-all' }}>
              <strong>Public link:</strong>{' '}
              <a href={publicShareableUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007AFF', textDecoration: 'none' }}>
                {publicShareableUrl}
              </a>
            </span>
            <button
              type="button"
              onClick={handleCopyPublicLink}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E7',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: copyButtonTextColor,
                cursor: 'pointer',
                marginLeft: '12px',
                flexShrink: 0,
              }}
            >
              {copyButtonLabelText}
            </button>
          </div>
        )}
      </div>

      {/* SPLIT PANE EDITOR */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Textarea */}
        <textarea
          value={noteBody}
          onChange={handleBodyChange}
          placeholder="Write markdown here..."
          style={{
            width: '50%',
            height: '100%',
            border: 'none',
            borderRight: '1px solid #E5E5E7',
            padding: '24px',
            fontSize: '14px',
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            lineHeight: '1.6',
            outline: 'none',
            resize: 'none',
            color: '#1D1D1F',
            backgroundColor: '#FFFFFF',
          }}
        />

        {/* Right: MarkdownPreview */}
        <div style={{ width: '50%', height: '100%', overflowY: 'auto' }}>
          <MarkdownPreview markdown={noteBody} />
        </div>
      </div>
    </div>
  );
}
