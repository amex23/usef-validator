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

    // Call USEF API
    const usefUrl = `https://www.usef.org/api/member/individual/${encodeURIComponent(sanitizedMemberId)}/${encodeURIComponent(sanitizedLastName)}`;
    
    console.log('Calling USEF API:', usefUrl);

    const response = await fetch(usefUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'USEF-Validator/1.0'
      }
    });

    if (!response.ok) {
      console.error('USEF API error:', response.status, response.statusText);
      return res.status(200).json({ 
        valid: false,
        error: 'Unable to verify membership. Please check your information and try again.'
      });
    }

    // Parse USEF response (should be boolean: true or false)
    const isActive = await response.json();

    console.log('USEF API response:', isActive);

    // Return validation result
    return res.status(200).json({ 
      valid: isActive === true,
      membershipId: sanitizedMemberId
    });

  } catch (error) {
    console.error('Validation error:', error);
    
    return res.status(500).json({ 
      valid: false, 
      error: 'An error occurred during validation. Please try again later.' 
    });
  }
}
