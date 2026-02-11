import crypto from 'crypto';

// USEF API Credentials (from the C# code)
const CLIENT_ID = '26646e5c1de143d4ad53414fabf76e1d';
const CLIENT_SECRET = '4bd6d9f47e6a44bcbd740e638f76d3b2';
const BASE_URL = 'https://api.usef.org/';

/**
 * Create USEF API authorization signature
 * Mimics the C# CreateSignature method
 */
function createUSEFSignature() {
  // Create HMAC-SHA256 hash
  const hmac = crypto.createHmac('sha256', CLIENT_SECRET);
  hmac.update(CLIENT_ID);
  const hash = hmac.digest('base64');
  
  // Return in format: ClientID:Base64Hash
  return `${CLIENT_ID}:${hash}`;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      valid: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Parse request body
    const { membershipId, lastName } = req.body;

    // Validate required fields
    if (!membershipId || !lastName) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Membership ID and Last Name are required' 
      });
    }

    // Sanitize inputs
    const sanitizedMemberId = String(membershipId).trim();
    const sanitizedLastName = String(lastName).trim();

    // Create USEF authorization signature
    const authSignature = createUSEFSignature();

    // IMPORTANT: You need to confirm the correct endpoint format
    // This is a guess based on your original requirement
    // The C# code uses: api/sponsors/sandbox/isactive/{code}
    // But you mentioned: api/member/individual/{id}/{lastName}
    
    // Try option 1: Individual member endpoint (if it exists)
    const usefUrl = `${BASE_URL}api/member/individual/${encodeURIComponent(sanitizedMemberId)}/${encodeURIComponent(sanitizedLastName)}`;
    
    console.log('Calling USEF API:', usefUrl);
    console.log('Authorization:', authSignature);

    const response = await fetch(usefUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authSignature,
        'User-Agent': 'USEF-Validator/1.0'
      }
    });

    console.log('USEF API status:', response.status);

    if (!response.ok) {
      console.error('USEF API error:', response.status, response.statusText);
      
      // If 404, the endpoint might not exist
      if (response.status === 404) {
        return res.status(200).json({ 
          valid: false,
          error: 'USEF API endpoint not found. Please verify the API endpoint format.',
          debug: {
            status: response.status,
            url: usefUrl,
            suggestion: 'Contact USEF to confirm the individual member validation endpoint'
          }
        });
      }
      
      return res.status(200).json({ 
        valid: false,
        error: 'Unable to verify membership. Please check your information and try again.',
        debug: {
          status: response.status,
          statusText: response.statusText
        }
      });
    }

    // Parse response
    const responseText = await response.text();
    console.log('USEF API response:', responseText);

    // Try to parse as JSON
    let isActive;
    try {
      isActive = JSON.parse(responseText);
    } catch (parseError) {
      // If it's just a boolean string "true" or "false"
      if (responseText === 'true' || responseText === 'false') {
        isActive = responseText === 'true';
      } else {
        console.error('Failed to parse USEF response:', parseError);
        return res.status(200).json({
          valid: false,
          error: 'Invalid response format from USEF API',
          debug: {
            responseText: responseText.substring(0, 200)
          }
        });
      }
    }

    console.log('USEF API parsed response:', isActive);

    // Return validation result
    return res.status(200).json({ 
      valid: isActive === true,
      membershipId: sanitizedMemberId
    });

  } catch (error) {
    console.error('Validation error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      valid: false, 
      error: 'An error occurred during validation. Please try again later.',
      debug: {
        message: error.message,
        name: error.name
      }
    });
  }
}