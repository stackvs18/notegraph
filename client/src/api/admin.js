import axios from 'axios';

// Create an axios HTTP client configured with the main backend API base URL
const adminApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Sends a GET request to fetch all registered users for the admin panel
export async function getAllUsers(authToken) {
  const requestConfigObject = {
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
  };
  const apiResponse = await adminApiClient.get('/admin/users', requestConfigObject);
  return apiResponse.data;
}

// Sends a GET request to fetch details for a single user by their ID
export async function getUserById(userId, authToken) {
  const requestConfigObject = {
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
  };
  const apiResponse = await adminApiClient.get('/admin/users/' + userId, requestConfigObject);
  return apiResponse.data;
}

// Sends a POST request to suspend a user with a specific duration and reason
export async function suspendUser(userId, suspendDuration, suspendReason, authToken) {
  const requestBodyObject = {
    duration: suspendDuration,
    reason: suspendReason,
  };
  const requestConfigObject = {
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
  };
  const apiResponse = await adminApiClient.post(
    '/admin/users/' + userId + '/suspend',
    requestBodyObject,
    requestConfigObject
  );
  return apiResponse.data;
}

// Sends a POST request to remove suspension from a user
export async function unsuspendUser(userId, authToken) {
  const requestBodyObject = {};
  const requestConfigObject = {
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
  };
  const apiResponse = await adminApiClient.post(
    '/admin/users/' + userId + '/unsuspend',
    requestBodyObject,
    requestConfigObject
  );
  return apiResponse.data;
}

// Sends a POST request to update the role of a user
export async function changeUserRole(userId, newRole, authToken) {
  const requestBodyObject = {
    role: newRole,
  };
  const requestConfigObject = {
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
  };
  const apiResponse = await adminApiClient.post(
    '/admin/users/' + userId + '/role',
    requestBodyObject,
    requestConfigObject
  );
  return apiResponse.data;
}

// Sends a POST request to create a new user with a specified role (superadmin only)
export async function createUser(username, email, password, role, authToken) {
  var requestBodyObject = {
    username: username,
    email: email,
    password: password,
    role: role,
  };
  var requestConfigObject = {
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
  };
  var apiResponse = await adminApiClient.post(
    '/admin/users/create',
    requestBodyObject,
    requestConfigObject
  );
  return apiResponse.data;
}

// Sends a GET request to fetch all notes belonging to a specific user (admin access)
export async function getUserNotes(userId, authToken) {
  var requestConfigObject = {
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
  };
  var apiResponse = await adminApiClient.get(
    '/admin/users/' + userId + '/notes',
    requestConfigObject
  );
  return apiResponse.data;
}

// Sends a DELETE request to soft-delete any note by its ID (admin access)
export async function adminDeleteNote(noteId, authToken) {
  var requestConfigObject = {
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
  };
  var apiResponse = await adminApiClient.delete(
    '/admin/notes/' + noteId,
    requestConfigObject
  );
  return apiResponse.data;
}
