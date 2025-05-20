/**
 * Test script for the Firestore synchronization endpoint
 * 
 * This script simulates a request to the sync-firestore endpoint
 * to test the synchronization functionality
 */

const syncController = require('./controllers/syncController');

// Mock Express request and response objects
const req = {
  user: {
    uid: 'test-user-id' // Replace with a valid user ID for testing
  }
};

const res = {
  json: (data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
  },
  status: (code) => {
    console.log('Status code:', code);
    return res;
  }
};

// Call the syncFirestoreData function
console.log('Testing Firestore synchronization...');
syncController.syncFirestoreData(req, res)
  .then(() => {
    console.log('Test completed');
  })
  .catch((error) => {
    console.error('Test failed:', error);
  });
