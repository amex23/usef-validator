export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      valid: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { membershipId, lastName } = req.body;

    if (!membershipId || !lastName) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Membership ID and Last Name are required' 
      });
    }

    // Test with JSONPlaceholder API
    const testUrl = `https://jsonplaceholder.typicode.com/users/${membershipId}`;
    
    console.log('Testing with URL:', testUrl);

    const response = await fetch(testUrl);
    
    console.log('Test API status:', response.status);

    if (!response.ok) {
      return res.status(200).json({ 
        valid: false,
        error: 'User not found in test database',
        testMode: true
      });
    }

    const userData = await response.json();
    
    console.log('Test API response:', userData);

    // Simple validation: if lastName matches the user's name (case-insensitive)
    const nameMatch = userData.name.toLowerCase().includes(lastName.toLowerCase());

    return res.status(200).json({ 
      valid: nameMatch,
      membershipId: membershipId,
      message: nameMatch 
        ? `✓ Verified! Found user: ${userData.name}` 
        : `✗ Name "${lastName}" doesn't match user: ${userData.name}`,
      testMode: true,
      userData: {
        id: userData.id,
        name: userData.name,
        email: userData.email
      }
    });

  } catch (error) {
    console.error('Test validation error:', error);
    
    return res.status(500).json({ 
      valid: false, 
      error: 'An error occurred during test validation',
      testMode: true,
      debug: {
        message: error.message
      }
    });
  }
}