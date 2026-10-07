require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Note = require('./models/Note');

const API = 'http://localhost:5000/api';

async function runCronTests() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/notegraph');

  // Clean test users & notes
  await User.deleteMany({ username: { $in: ['cronuser', 'cronadmin'] } });
  await Note.deleteMany({ title: { $in: ['Expired Cron Note', 'Permanent Admin Note', 'Valid User Note'] } });

  // Register cronuser
  let res = await fetch(API + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'cronuser', email: 'cronuser@example.com', password: 'Password123' }),
  });
  let data = await res.json();
  const userToken = data.token;

  // Step 2: Create public note
  res = await fetch(API + '/notes', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + userToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Expired Cron Note',
      body: 'Will expire soon',
      visibility: 'public',
    }),
  });
  data = await res.json();
  const expiredNote = data.note;
  console.log('Step 2 - Note created:', expiredNote._id, 'nanoid:', expiredNote.nanoid);

  // Step 3: Set expiresAt to 30s in the past
  const dbExpiredNote = await Note.findById(expiredNote._id);
  dbExpiredNote.expiresAt = new Date(Date.now() - 30 * 1000);
  await dbExpiredNote.save();
  console.log('Step 3 - Set expiresAt to 30 seconds in the past');

  // Step 7: Create permanent admin note
  const adminUser = new User({
    username: 'cronadmin',
    email: 'cronadmin@example.com',
    passwordHash: 'Password123',
    role: 'admin',
  });
  await adminUser.save();

  res = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'cronadmin', password: 'Password123' }),
  });
  data = await res.json();
  const adminToken = data.token;

  res = await fetch(API + '/notes', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Permanent Admin Note',
      body: 'Never expires',
      visibility: 'public',
    }),
  });
  data = await res.json();
  const permanentNote = data.note;
  console.log('Step 7 - Permanent admin note created:', permanentNote._id, 'isPermanent:', permanentNote.isPermanent, 'expiresAt:', permanentNote.expiresAt);

  // Step 8: Create fresh valid user note (2-day expiry)
  res = await fetch(API + '/notes', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + userToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Valid User Note',
      body: 'Active for 2 days',
      visibility: 'public',
    }),
  });
  data = await res.json();
  const validNote = data.note;
  console.log('Step 8 - Valid user note created:', validNote._id, 'expiresAt:', validNote.expiresAt);

  // Step 4: Wait up to 65 seconds for cron cycle to trigger
  console.log('Waiting up to 65 seconds for cron job execution...');
  await new Promise((resolve) => setTimeout(resolve, 65 * 1000));

  // Step 5: Confirm expiredNote is TRULY gone
  const checkExpired = await Note.findById(expiredNote._id);
  console.log('Step 5 - Expired note in DB (should be null):', checkExpired);

  // Step 6: GET /api/notes/public/<nanoid> (should return 404)
  res = await fetch(API + '/notes/public/' + expiredNote.nanoid);
  data = await res.json();
  console.log('Step 6 - GET expired note by nanoid status (expected 404):', res.status, 'message:', data.message);

  // Step 7 check: Permanent note still exists
  const checkPermanent = await Note.findById(permanentNote._id);
  console.log('Step 7 - Permanent admin note still exists in DB:', !!checkPermanent);

  // Step 8 check: Valid user note still exists
  const checkValid = await Note.findById(validNote._id);
  console.log('Step 8 - Valid user note still exists in DB:', !!checkValid);

  // Clean up remaining test data
  await User.deleteMany({ username: { $in: ['cronuser', 'cronadmin'] } });
  await Note.deleteMany({ _id: { $in: [expiredNote._id, permanentNote._id, validNote._id] } });
  await mongoose.disconnect();
  console.log('All verification steps completed!');
}

runCronTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
