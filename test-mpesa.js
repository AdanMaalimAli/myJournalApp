const path = require('path');
const axiosModule = require(path.join(__dirname, 'backend', 'node_modules', 'axios'));
const axios = axiosModule.default || axiosModule;
const dotenv = require(path.join(__dirname, 'backend', 'node_modules', 'dotenv'));
dotenv.config({ path: './backend/.env' });

async function test() {
  console.log('--- M-Pesa OAuth Test ---');
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    console.log('Sending request to Safaricom...');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: { Authorization: `Basic ${auth}` },
        timeout: 20000
      }
    );
    console.log('SUCCESS! Token received:', response.data.access_token.substring(0, 10) + '...');
  } catch (error) {
    console.error('FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

test();
