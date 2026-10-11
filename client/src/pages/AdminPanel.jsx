import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, suspendUser, unsuspendUser, changeUserRole, createUser, getUserNotes, adminDeleteNote } from '../api/admin';

// Renders the Admin Panel page allowing admins and superadmins to manage users, suspensions, and roles
export default function AdminPanel() {
  const authContext = useAuth();
  const currentUserObject = authContext.user;
  const authenticationToken = authContext.token;

  const navigateHook = useNavigate();

  const allUsersState = React.useState([]);
  const allUsers = allUsersState[0];
  const setAllUsers = allUsersState[1];

  const isLoadingState = React.useState(true);
  const isLoading = isLoadingState[0];
  const setIsLoading = isLoadingState[1];

  const errorMessageState = React.useState('');
  const errorMessage = errorMessageState[0];
  const setErrorMessage = errorMessageState[1];

  const activeSuspendUserIdState = React.useState(null);
  const activeSuspendUserId = activeSuspendUserIdState[0];
  const setActiveSuspendUserId = activeSuspendUserIdState[1];

  const suspendDurationState = React.useState('2h');
  const suspendDuration = suspendDurationState[0];
  const setSuspendDuration = suspendDurationState[1];

  const suspendReasonState = React.useState('');
  const suspendReason = suspendReasonState[0];
  const setSuspendReason = suspendReasonState[1];

  const roleSelectionsState = React.useState({});
  const roleSelections = roleSelectionsState[0];
  const setRoleSelections = roleSelectionsState[1];

  const actionMessageState = React.useState('');
  const actionMessage = actionMessageState[0];
  const setActionMessage = actionMessageState[1];

  // State for the "Create User" form (superadmin only)
  const showCreateFormState = React.useState(false);
  const showCreateForm = showCreateFormState[0];
  const setShowCreateForm = showCreateFormState[1];

  const createUsernameState = React.useState('');
  const createUsername = createUsernameState[0];
  const setCreateUsername = createUsernameState[1];

  const createEmailState = React.useState('');
  const createEmail = createEmailState[0];
  const setCreateEmail = createEmailState[1];

  const createPasswordState = React.useState('');
  const createPassword = createPasswordState[0];
  const setCreatePassword = createPasswordState[1];

  const createRoleState = React.useState('admin');
  const createRole = createRoleState[0];

  // State for the "View Notes" expandable section
  const expandedUserIdState = React.useState(null);
  const expandedUserId = expandedUserIdState[0];
  const setExpandedUserId = expandedUserIdState[1];

  // Cache of fetched user notes: { userId: [noteObject, ...] }
  const userNotesMapState = React.useState({});
  const userNotesMap = userNotesMapState[0];
  const setUserNotesMap = userNotesMapState[1];

  const userNotesLoadingState = React.useState(false);
  const isUserNotesLoading = userNotesLoadingState[0];
  const setIsUserNotesLoading = userNotesLoadingState[1];
  const setCreateRole = createRoleState[1];

  // Fetches the complete list of users from the admin backend API
  async function fetchAllUsersList() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const apiResponseData = await getAllUsers(authenticationToken);
      let fetchedUsersList = [];
      if (apiResponseData.users !== null && apiResponseData.users !== undefined) {
        fetchedUsersList = apiResponseData.users;
      }
      setAllUsers(fetchedUsersList);
      setIsLoading(false);
    } catch (errorObject) {
      setIsLoading(false);
      setErrorMessage('Failed to load users list. Please try again.');
    }
  }

  // Effect hook to fetch users list when authentication token is available
  React.useEffect(function () {
    if (authenticationToken !== null && authenticationToken !== undefined) {
      fetchAllUsersList();
    }
  }, [authenticationToken]);

  // Handles updating user suspension state after submitting the suspension form
  async function handleConfirmSuspend(targetUserId) {
    setActionMessage('');

    try {
      const apiResponseData = await suspendUser(
        targetUserId,
        suspendDuration,
        suspendReason,
        authenticationToken
      );

      const updatedUserObject = apiResponseData.user;

      // Use a plain for loop to locate the matching user by ID and update it in place
      const newUsersList = [];
      for (let userIndex = 0; userIndex < allUsers.length; userIndex = userIndex + 1) {
        const existingUserNode = allUsers[userIndex];

        let existingUserIdString = existingUserNode._id;
        if (existingUserIdString === null || existingUserIdString === undefined) {
          existingUserIdString = existingUserNode.id;
        }

        if (String(existingUserIdString) === String(targetUserId)) {
          const updatedUserCopy = {
            _id: existingUserNode._id,
            id: existingUserNode.id,
            username: existingUserNode.username,
            email: existingUserNode.email,
            role: existingUserNode.role,
            suspension: updatedUserObject.suspension,
          };
          newUsersList.push(updatedUserCopy);
        } else {
          newUsersList.push(existingUserNode);
        }
      }

      setAllUsers(newUsersList);
      setActiveSuspendUserId(null);
      setSuspendReason('');
      setSuspendDuration('2h');
      setActionMessage('User suspended successfully.');
    } catch (errorObject) {
      setActionMessage('Failed to suspend user.');
    }
  }

  // Handles clearing suspension for a suspended user
  async function handleUnsuspend(targetUserId) {
    setActionMessage('');

    try {
      const apiResponseData = await unsuspendUser(targetUserId, authenticationToken);
      const updatedUserObject = apiResponseData.user;

      // Use a plain for loop to locate the matching user by ID and update its suspension state
      const newUsersList = [];
      for (let userIndex = 0; userIndex < allUsers.length; userIndex = userIndex + 1) {
        const existingUserNode = allUsers[userIndex];

        let existingUserIdString = existingUserNode._id;
        if (existingUserIdString === null || existingUserIdString === undefined) {
          existingUserIdString = existingUserNode.id;
        }

        if (String(existingUserIdString) === String(targetUserId)) {
          const updatedUserCopy = {
            _id: existingUserNode._id,
            id: existingUserNode.id,
            username: existingUserNode.username,
            email: existingUserNode.email,
            role: existingUserNode.role,
            suspension: updatedUserObject.suspension,
          };
          newUsersList.push(updatedUserCopy);
        } else {
          newUsersList.push(existingUserNode);
        }
      }

      setAllUsers(newUsersList);
      setActionMessage('Suspension cleared successfully.');
    } catch (errorObject) {
      setActionMessage('Failed to unsuspend user.');
    }
  }

  // Handles updating the role of a user when requested by a superadmin
  async function handleChangeRole(targetUserId, currentRole) {
    setActionMessage('');

    let selectedNewRole = roleSelections[targetUserId];
    if (selectedNewRole === null || selectedNewRole === undefined) {
      selectedNewRole = currentRole;
    }

    if (selectedNewRole === currentRole) {
      return;
    }

    try {
      const apiResponseData = await changeUserRole(targetUserId, selectedNewRole, authenticationToken);
      const updatedUserObject = apiResponseData.user;

      // Use a plain for loop to locate the matching user by ID and update its role
      const newUsersList = [];
      for (let userIndex = 0; userIndex < allUsers.length; userIndex = userIndex + 1) {
        const existingUserNode = allUsers[userIndex];

        let existingUserIdString = existingUserNode._id;
        if (existingUserIdString === null || existingUserIdString === undefined) {
          existingUserIdString = existingUserNode.id;
        }

        if (String(existingUserIdString) === String(targetUserId)) {
          const updatedUserCopy = {
            _id: existingUserNode._id,
            id: existingUserNode.id,
            username: existingUserNode.username,
            email: existingUserNode.email,
            role: updatedUserObject.role,
            suspension: existingUserNode.suspension,
          };
          newUsersList.push(updatedUserCopy);
        } else {
          newUsersList.push(existingUserNode);
        }
      }

      setAllUsers(newUsersList);
      setActionMessage('User role updated successfully.');
    } catch (errorObject) {
      setActionMessage('Failed to update user role.');
    }
  }

  // Updates local role selection state when a dropdown value changes for a specific user
  function handleRoleDropdownChange(targetUserId, selectedRoleValue) {
    const newRoleSelectionsMap = {};
    const currentKeysList = Object.keys(roleSelections);
    for (let keyIdx = 0; keyIdx < currentKeysList.length; keyIdx = keyIdx + 1) {
      const keyString = currentKeysList[keyIdx];
      newRoleSelectionsMap[keyString] = roleSelections[keyString];
    }
    newRoleSelectionsMap[targetUserId] = selectedRoleValue;
    setRoleSelections(newRoleSelectionsMap);
  }

  // Handles creating a new user via the superadmin create-user API
  async function handleCreateUser() {
    setActionMessage('');

    if (createUsername === '' || createEmail === '' || createPassword === '') {
      setActionMessage('Please fill in all fields.');
      return;
    }

    try {
      await createUser(createUsername, createEmail, createPassword, createRole, authenticationToken);
      setActionMessage('User "' + createUsername + '" created successfully with role "' + createRole + '".');
      setCreateUsername('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('admin');
      setShowCreateForm(false);
      // Refresh the users list so the new user appears in the table
      fetchAllUsersList();
    } catch (errorObject) {
      var errorMsg = 'Failed to create user.';
      if (errorObject.response && errorObject.response.data && errorObject.response.data.message) {
        errorMsg = errorObject.response.data.message;
      }
      setActionMessage(errorMsg);
    }
  }

  // Handles clicking "View Notes" — toggles expand and fetches the user's notes if not cached
  async function handleViewUserNotes(targetUserId) {
    // If already expanded for this user, collapse it
    if (expandedUserId === targetUserId) {
      setExpandedUserId(null);
      return;
    }

    // Expand this user's row
    setExpandedUserId(targetUserId);
    setIsUserNotesLoading(true);

    try {
      var apiResponseData = await getUserNotes(targetUserId, authenticationToken);
      var fetchedNotesList = [];
      if (apiResponseData !== null && apiResponseData !== undefined) {
        if (apiResponseData.notes !== null && apiResponseData.notes !== undefined) {
          fetchedNotesList = apiResponseData.notes;
        }
      }

      // Update the cache map with this user's notes
      var newMap = {};
      var existingKeys = Object.keys(userNotesMap);
      for (var keyIdx = 0; keyIdx < existingKeys.length; keyIdx = keyIdx + 1) {
        var keyStr = existingKeys[keyIdx];
        newMap[keyStr] = userNotesMap[keyStr];
      }
      newMap[targetUserId] = fetchedNotesList;
      setUserNotesMap(newMap);
      setIsUserNotesLoading(false);
    } catch (errorObject) {
      console.error('Fetch user notes error:', errorObject);
      setIsUserNotesLoading(false);
      setActionMessage('Failed to load notes for this user.');
    }
  }

  // Handles admin-deleting a note and removing it from the cached list
  async function handleAdminDeleteNote(noteId, ownerUserId) {
    var isConfirmed = window.confirm('Are you sure you want to delete this note?');
    if (!isConfirmed) {
      return;
    }

    try {
      await adminDeleteNote(noteId, authenticationToken);

      // Remove the deleted note from the cached notes list for this user
      var currentNotesList = userNotesMap[ownerUserId];
      if (currentNotesList === null || currentNotesList === undefined) {
        currentNotesList = [];
      }

      var updatedNotesList = [];
      for (var i = 0; i < currentNotesList.length; i = i + 1) {
        if (String(currentNotesList[i]._id) !== String(noteId)) {
          updatedNotesList.push(currentNotesList[i]);
        }
      }

      // Rebuild the map with the updated list
      var newMap = {};
      var existingKeys = Object.keys(userNotesMap);
      for (var keyIdx = 0; keyIdx < existingKeys.length; keyIdx = keyIdx + 1) {
        var keyStr = existingKeys[keyIdx];
        newMap[keyStr] = userNotesMap[keyStr];
      }
      newMap[ownerUserId] = updatedNotesList;
      setUserNotesMap(newMap);
      setActionMessage('Note deleted successfully.');
    } catch (errorObject) {
      console.error('Admin delete note error:', errorObject);
      setActionMessage('Failed to delete note.');
    }
  }

  // Navigates to the Editor page to edit a specific note
  function handleAdminEditNote(noteId) {
    navigateHook('/editor/' + noteId);
  }

  // Render Step 3: Loading state
  if (isLoading === true) {
    return (
      <div
        style={{
          paddingTop: '72px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
          color: '#6E6E73',
          fontSize: '16px',
        }}
      >
        Loading admin panel...
      </div>
    );
  }

  // Render Step 3: Error state with Retry button
  if (errorMessage !== null && errorMessage !== undefined && errorMessage !== '') {
    return (
      <div
        style={{
          paddingTop: '72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
        }}
      >
        <div style={{ color: '#FF3B30', fontSize: '16px', marginBottom: '16px' }}>
          {errorMessage}
        </div>
        <button
          onClick={function () {
            fetchAllUsersList();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007AFF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Determine current logged-in user credentials and role for permission checks
  let currentUserIdString = '';
  if (currentUserObject !== null && currentUserObject !== undefined) {
    if (currentUserObject.id !== null && currentUserObject.id !== undefined) {
      currentUserIdString = String(currentUserObject.id);
    } else if (currentUserObject._id !== null && currentUserObject._id !== undefined) {
      currentUserIdString = String(currentUserObject._id);
    }
  }

  let currentUserRoleString = 'user';
  if (currentUserObject !== null && currentUserObject !== undefined) {
    if (currentUserObject.role !== null && currentUserObject.role !== undefined) {
      currentUserRoleString = currentUserObject.role;
    }
  }

  // Build table rows for each user in allUsers list using a plain for loop
  const tableRowElementsList = [];
  for (let userIndex = 0; userIndex < allUsers.length; userIndex = userIndex + 1) {
    const rowUserObject = allUsers[userIndex];

    let rowUserIdString = rowUserObject._id;
    if (rowUserIdString === null || rowUserIdString === undefined) {
      rowUserIdString = rowUserObject.id;
    }
    rowUserIdString = String(rowUserIdString);

    // Step 5: Format suspension status
    let suspensionStatusElement = null;
    let isSuspendedActiveBool = false;
    let isSuspendedPermanentBool = false;
    let suspensionReasonString = '';
    let suspensionUntilString = '';

    if (rowUserObject.suspension !== null && rowUserObject.suspension !== undefined) {
      if (rowUserObject.suspension.active === true) {
        isSuspendedActiveBool = true;
      }
      if (rowUserObject.suspension.isPermanent === true) {
        isSuspendedPermanentBool = true;
      }
      if (rowUserObject.suspension.reason !== null && rowUserObject.suspension.reason !== undefined) {
        suspensionReasonString = rowUserObject.suspension.reason;
      }
      if (rowUserObject.suspension.until !== null && rowUserObject.suspension.until !== undefined) {
        suspensionUntilString = String(rowUserObject.suspension.until);
      }
    }

    if (isSuspendedActiveBool === false) {
      suspensionStatusElement = (
        <span style={{ color: '#1D1D1F', fontWeight: '500' }}>
          Active
        </span>
      );
    } else {
      let statusText = '';
      if (isSuspendedPermanentBool === true) {
        statusText = 'Suspended (permanent)';
      } else {
        statusText = 'Suspended until ' + suspensionUntilString;
      }

      suspensionStatusElement = (
        <div>
          <div style={{ color: '#FF3B30', fontWeight: '500' }}>
            {statusText}
          </div>
          {suspensionReasonString !== '' && (
            <div style={{ color: '#6E6E73', fontSize: '12px', marginTop: '2px' }}>
              Reason: {suspensionReasonString}
            </div>
          )}
        </div>
      );
    }

    // Step 6: Decide whether to show Suspend action button using separate clear if checks
    // Check A: Does this row belong to currently logged in user?
    let isCurrentUserRowBool = false;
    if (currentUserIdString !== '' && rowUserIdString !== '') {
      if (currentUserIdString === rowUserIdString) {
        isCurrentUserRowBool = true;
      }
    }

    // Check B: Is current user's role "admin" (not superadmin) targeting an admin or superadmin?
    let isTargetAdminOrSuperadminBool = false;
    if (rowUserObject.role === 'admin' || rowUserObject.role === 'superadmin') {
      isTargetAdminOrSuperadminBool = true;
    }

    let isPlainAdminTargetingAdminBool = false;
    if (currentUserRoleString === 'admin') {
      if (isTargetAdminOrSuperadminBool === true) {
        isPlainAdminTargetingAdminBool = true;
      }
    }

    let canShowSuspendButtonBool = true;
    if (isCurrentUserRowBool === true) {
      canShowSuspendButtonBool = false;
    }
    if (isPlainAdminTargetingAdminBool === true) {
      canShowSuspendButtonBool = false;
    }

    // Step 6: Render action controls (Suspend / Unsuspend buttons and forms)
    let actionControlsElement = null;
    if (isSuspendedActiveBool === false) {
      // User is NOT suspended
      if (canShowSuspendButtonBool === true) {
        if (activeSuspendUserId === rowUserIdString) {
          // Suspend form is open for this row
          actionControlsElement = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '200px' }}>
              <select
                value={suspendDuration}
                onChange={function (eventObject) {
                  setSuspendDuration(eventObject.target.value);
                }}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D1D1D6' }}
              >
                <option value="2h">2 Hours</option>
                <option value="24h">24 Hours</option>
                <option value="48h">48 Hours</option>
                <option value="permanent">Permanent</option>
              </select>

              <input
                type="text"
                placeholder="Reason for suspension"
                value={suspendReason}
                onChange={function (eventObject) {
                  setSuspendReason(eventObject.target.value);
                }}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D1D1D6', fontSize: '13px' }}
              />

              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button
                  onClick={function () {
                    handleConfirmSuspend(rowUserIdString);
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#FF3B30',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Confirm Suspend
                </button>
                <button
                  onClick={function () {
                    setActiveSuspendUserId(null);
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#E5E5E7',
                    color: '#1D1D1F',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        } else {
          // Suspend button
          actionControlsElement = (
            <button
              onClick={function () {
                setActiveSuspendUserId(rowUserIdString);
              }}
              style={{
                padding: '4px 10px',
                backgroundColor: '#FF3B30',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Suspend
            </button>
          );
        }
      }
    } else {
      // User IS suspended
      let isUnsuspendDisabledBool = false;
      if (isSuspendedPermanentBool === true) {
        if (currentUserRoleString !== 'superadmin') {
          isUnsuspendDisabledBool = true;
        }
      }

      if (isUnsuspendDisabledBool === true) {
        actionControlsElement = (
          <div>
            <button
              disabled={true}
              style={{
                padding: '4px 10px',
                backgroundColor: '#E5E5E7',
                color: '#8E8E93',
                border: 'none',
                borderRadius: '4px',
                cursor: 'not-allowed',
                fontSize: '13px',
              }}
            >
              Unsuspend
            </button>
            <div style={{ color: '#6E6E73', fontSize: '11px', marginTop: '2px' }}>
              Only a superadmin can clear this
            </div>
          </div>
        );
      } else {
        actionControlsElement = (
          <button
            onClick={function () {
              handleUnsuspend(rowUserIdString);
            }}
            style={{
              padding: '4px 10px',
              backgroundColor: '#34C759',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Unsuspend
          </button>
        );
      }
    }

    // Step 7: Role change dropdown (superadmin only)
    let roleControlElement = null;
    if (currentUserRoleString === 'superadmin') {
      let selectedRoleValue = roleSelections[rowUserIdString];
      if (selectedRoleValue === null || selectedRoleValue === undefined) {
        selectedRoleValue = rowUserObject.role;
      }

      roleControlElement = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={selectedRoleValue}
            onChange={function (eventObject) {
              handleRoleDropdownChange(rowUserIdString, eventObject.target.value);
            }}
            style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #D1D1D6', fontSize: '13px' }}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
          <button
            onClick={function () {
              handleChangeRole(rowUserIdString, rowUserObject.role);
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#007AFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Change
          </button>
        </div>
      );
    } else {
      roleControlElement = (
        <span style={{ fontSize: '13px', color: '#1D1D1F' }}>
          {rowUserObject.role}
        </span>
      );
    }

    // "View Notes" button for this user row
    var viewNotesButtonElement = (
      <button
        onClick={function () {
          handleViewUserNotes(rowUserIdString);
        }}
        style={{
          padding: '4px 10px',
          backgroundColor: expandedUserId === rowUserIdString ? '#1D1D1F' : '#F5F5F7',
          color: expandedUserId === rowUserIdString ? '#FFFFFF' : '#1D1D1F',
          border: '1px solid #E5E5E7',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '500',
          transition: 'all 0.15s ease',
        }}
      >
        {expandedUserId === rowUserIdString ? 'Hide Notes' : 'View Notes'}
      </button>
    );

    tableRowElementsList.push(
      <tr key={rowUserIdString} style={{ borderBottom: '1px solid #E5E5E7' }}>
        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1D1D1F' }}>
          {rowUserObject.username}
        </td>
        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1D1D1F' }}>
          {rowUserObject.email}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {roleControlElement}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {suspensionStatusElement}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {actionControlsElement}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {viewNotesButtonElement}
        </td>
      </tr>
    );

    // If this user's notes section is expanded, add an extra row below
    if (expandedUserId === rowUserIdString) {
      var expandedNotesContent = null;

      if (isUserNotesLoading === true) {
        expandedNotesContent = (
          <div style={{ color: '#6E6E73', fontSize: '14px', padding: '16px 0' }}>
            Loading notes...
          </div>
        );
      } else {
        var cachedNotesList = userNotesMap[rowUserIdString];
        if (cachedNotesList === null || cachedNotesList === undefined) {
          cachedNotesList = [];
        }

        if (cachedNotesList.length === 0) {
          expandedNotesContent = (
            <div style={{ color: '#6E6E73', fontSize: '14px', padding: '16px 0' }}>
              This user has no notes.
            </div>
          );
        } else {
          // Build a list of note cards using a plain for loop
          var noteCardElements = [];
          for (var noteIdx = 0; noteIdx < cachedNotesList.length; noteIdx = noteIdx + 1) {
            var singleNote = cachedNotesList[noteIdx];
            var singleNoteId = String(singleNote._id);

            // Build tag pill elements for this note
            var tagPillElements = [];
            var noteTags = singleNote.tags;
            if (noteTags === null || noteTags === undefined) {
              noteTags = [];
            }
            for (var tagIdx = 0; tagIdx < noteTags.length; tagIdx = tagIdx + 1) {
              tagPillElements.push(
                <span
                  key={tagIdx}
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    border: '1px solid #E5E5E7',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#6E6E73',
                    marginRight: '4px',
                  }}
                >
                  {noteTags[tagIdx]}
                </span>
              );
            }

            // Visibility badge color
            var visibilityColor = '#6E6E73';
            if (singleNote.visibility === 'private') {
              visibilityColor = '#FF9500';
            }

            // We need to capture the noteId and userId in a closure for the button handlers
            // Using an IIFE-style function to avoid stale closure issues in the for loop
            var editNoteId = singleNoteId;
            var deleteNoteId = singleNoteId;
            var deleteOwnerUserId = rowUserIdString;

            noteCardElements.push(
              <div
                key={singleNoteId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5E7',
                  borderRadius: '6px',
                  gap: '12px',
                }}
              >
                {/* Left side: title, visibility badge, tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1D1D1F' }}>
                    {singleNote.title}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: visibilityColor,
                      backgroundColor: '#F5F5F7',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      textTransform: 'capitalize',
                      fontWeight: '500',
                    }}
                  >
                    {singleNote.visibility}
                  </span>
                  {tagPillElements}
                </div>

                {/* Right side: Edit and Delete buttons */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    data-note-id={editNoteId}
                    onClick={function (eventObject) {
                      var clickedNoteId = eventObject.currentTarget.getAttribute('data-note-id');
                      handleAdminEditNote(clickedNoteId);
                    }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#007AFF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    data-note-id={deleteNoteId}
                    data-owner-id={deleteOwnerUserId}
                    onClick={function (eventObject) {
                      var clickedNoteId = eventObject.currentTarget.getAttribute('data-note-id');
                      var clickedOwnerId = eventObject.currentTarget.getAttribute('data-owner-id');
                      handleAdminDeleteNote(clickedNoteId, clickedOwnerId);
                    }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'transparent',
                      color: '#FF3B30',
                      border: '1px solid #FF3B30',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          }

          expandedNotesContent = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: '#6E6E73', marginBottom: '4px' }}>
                {cachedNotesList.length + ' note' + (cachedNotesList.length === 1 ? '' : 's')}
              </div>
              {noteCardElements}
            </div>
          );
        }
      }

      tableRowElementsList.push(
        <tr key={rowUserIdString + '-notes'} style={{ borderBottom: '1px solid #E5E5E7' }}>
          <td
            colSpan={6}
            style={{
              padding: '12px 16px',
              backgroundColor: '#FAFAFA',
            }}
          >
            {expandedNotesContent}
          </td>
        </tr>
      );
    }
  }

  return (
    <div
      style={{
        paddingTop: '68px',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: '40px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* Step 8: Heading */}
      <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px' }}>
        Admin Panel
      </h1>
      <p style={{ color: '#6E6E73', fontSize: '14px', marginBottom: '24px' }}>
        Manage platform users, suspension statuses, and system access roles.
      </p>

      {/* Create User section — only visible to superadmins */}
      {currentUserRoleString === 'superadmin' && (
        <div style={{ marginBottom: '24px' }}>
          {showCreateForm === false && (
            <button
              onClick={function () {
                setShowCreateForm(true);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007AFF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              + Create New User
            </button>
          )}

          {showCreateForm === true && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E7',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontWeight: '600', fontSize: '16px', color: '#1D1D1F', marginBottom: '16px' }}>
                Create New User
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Username"
                  value={createUsername}
                  onChange={function (e) { setCreateUsername(e.target.value); }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #D1D1D6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '180px',
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={createEmail}
                  onChange={function (e) { setCreateEmail(e.target.value); }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #D1D1D6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '220px',
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={createPassword}
                  onChange={function (e) { setCreatePassword(e.target.value); }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #D1D1D6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '180px',
                  }}
                />
                <select
                  value={createRole}
                  onChange={function (e) { setCreateRole(e.target.value); }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #D1D1D6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="superadmin">superadmin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreateUser}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#34C759',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  Create
                </button>
                <button
                  onClick={function () {
                    setShowCreateForm(false);
                    setCreateUsername('');
                    setCreateEmail('');
                    setCreatePassword('');
                    setCreateRole('admin');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#E5E5E7',
                    color: '#1D1D1F',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {actionMessage !== '' && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#F2F2F7',
            borderRadius: '6px',
            color: '#1D1D1F',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* Step 4: Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E5E5E7',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F5F5F7', borderBottom: '1px solid #E5E5E7' }}>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6E6E73' }}>Username</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6E6E73' }}>Email</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6E6E73' }}>Role</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6E6E73' }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6E6E73' }}>Actions</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6E6E73' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {tableRowElementsList}
          </tbody>
        </table>
      </div>
    </div>
  );
}
