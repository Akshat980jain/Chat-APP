const axios = require('axios');

// Test the login endpoint with proper JSON
async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    console.log('Sending login data:', { ...loginData, password: '[REDACTED]' });
    console.log('Data type:', typeof loginData);
    console.log('JSON stringified:', JSON.stringify(loginData));
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Test with malformed JSON to reproduce the error
async function testMalformedJSON() {
  try {
    console.log('\nTesting with malformed JSON...');
    
    // This should cause a JSON parsing error
    const malformedData = '"Akshat Jain"';
    
    console.log('Sending malformed data:', malformedData);
    console.log('Data type:', typeof malformedData);
    
    const response = await axios.post('http://localhost:5000/api/auth/login', malformedData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Malformed JSON test result:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
async function runTests() {
  console.log('Starting login endpoint tests...\n');
  
  await testLogin();
  await testMalformedJSON();
  
  console.log('\nTests completed.');
}

runTests(); 