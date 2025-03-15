// server.js - A simple Express server to proxy OpenAI API requests
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
if (!SPOONACULAR_API_KEY) {
  console.warn('Warning: SPOONACULAR_API_KEY not found in environment variables');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory with proper options

// Load restaurant data
let restaurantData;
try {
  restaurantData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'restaurants.json'), 'utf8'));
} catch (error) {
  console.error('Error loading restaurant data:', error);
  restaurantData = { restaurants: [] };
}

// Load snack data
let snackData;
try {
  snackData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'snacks.json'), 'utf8'));
} catch (error) {
  console.error('Error loading snack data:', error);
  snackData = { snacks: [] };
}

// OpenAI API proxy endpoint
app.post('/api/chat', async (req, res) => {
  try {
    // Get messages from request body
    const { messages } = req.body;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    // Get response data
    const data = await response.json();

    // Send response back to client
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Add placeholder image endpoint for demo
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  res.set('Content-Type', 'image/svg+xml');
  res.send(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#4CAF50" opacity="0.3"/>
    <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#263238" 
          text-anchor="middle" dominant-baseline="middle">HolistiQ</text>
  </svg>`);
});

// Get all restaurants endpoint
app.get('/api/restaurants', (req, res) => {
  res.json(restaurantData.restaurants);
});

// Restaurant recommendation endpoint
app.post('/api/restaurant-recommendations', (req, res) => {
  try {
    const { preferences } = req.body;
    
    // Filter restaurants based on user preferences
    let recommendations = [...restaurantData.restaurants];
    
    if (preferences) {
      // Filter by cuisine if specified
      if (preferences.cuisine) {
        recommendations = recommendations.filter(restaurant => 
          restaurant.cuisine.toLowerCase().includes(preferences.cuisine.toLowerCase())
        );
      }
      
      // Filter by dietary options if specified
      if (preferences.dietary && preferences.dietary.length > 0) {
        recommendations = recommendations.filter(restaurant => 
          preferences.dietary.some(diet => 
            restaurant.dietaryOptions.some(option => 
              option.toLowerCase().includes(diet.toLowerCase())
            )
          )
        );
      }
      
      // Filter by price range if specified
      if (preferences.priceRange) {
        recommendations = recommendations.filter(restaurant => 
          restaurant.priceRange === preferences.priceRange
        );
      }
      
      // Sort by health score if specified
      if (preferences.sortByHealth) {
        recommendations = recommendations.sort((a, b) => b.healthScore - a.healthScore);
      }
    }
    
    // If no recommendations match the criteria, return all sorted by health score
    if (recommendations.length === 0) {
      recommendations = restaurantData.restaurants.sort((a, b) => b.healthScore - a.healthScore);
    } else {
      // Show all
      recommendations;
    }
    
    res.json({ recommendations });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process recommendation request' });
  }
});

// Snack recommendation endpoint using Spoonacular API
app.post('/api/snack-search', async (req, res) => {
  try {
    const { query, diet, intolerances, maxCalories, requestType } = req.body;
    
    // Build the URL with query parameters
    let url = `https://api.spoonacular.com/food/products/search?apiKey=${SPOONACULAR_API_KEY}`;

    // Add search query with specialized terms based on requestType
    let searchQuery = query || "healthy snack";
    if (requestType === "high_protein") {
      searchQuery = "high protein " + searchQuery;
    } else if (requestType === "low_calorie") {
      searchQuery = "low calorie " + searchQuery;
    }

    // Add randomness to the query
    const randomTerms = ["healthy", "nutritious", "natural", "protein", "wholesome"];
    const randomTerm = randomTerms[Math.floor(Math.random() * randomTerms.length)];

    // Occasionally add a random term for variety
    if (Math.random() > 0.5) {
      searchQuery = searchQuery + " " + randomTerm;
    }

    url += `&query=${encodeURIComponent(searchQuery)}`;

    // Add dietary restrictions if provided
    if (diet) {
      url += `&diet=${encodeURIComponent(diet)}`;
    }

    // Add intolerances if provided
    if (intolerances && intolerances.length > 0) {
      url += `&intolerances=${encodeURIComponent(intolerances.join(','))}`;
    }

    // Add random offset to get different results each time
    const offset = Math.floor(Math.random() * 20);
    url += `&offset=${offset}`;
    
    // Set result limits
    url += "&number=10"; // Limit to 5 results to save API calls
    
    console.log("Calling Spoonacular API:", url);
    
    // Make the API request
    const response = await fetch(url);
    const responseData = await response.json();
    console.log("Spoonacular API data preview:", 
      JSON.stringify(responseData).substring(0, 300) + "...");

    // Log API response status
    console.log("Spoonacular API response status:", response.status);

    // Check if the response is successful
    if (!response.ok) {
      console.error("Spoonacular API returned error:", await response.text());
      throw new Error(`API returned status ${response.status}`);
    }
    
    // Check if we have valid data
    if (!responseData.products || responseData.products.length === 0) {
      // Fallback to our local database if no results from API
      return res.json({ 
        recommendations: [], 
        message: "No matching products found" 
      });
    }
    
    // For each product, get additional details
    // Note: This makes multiple API calls, be mindful of your rate limits
    const productPromises = responseData.products.slice(0, 3).map(async (product) => {
      try {
        const detailUrl = `https://api.spoonacular.com/food/products/${product.id}?apiKey=${SPOONACULAR_API_KEY}`;
        const detailResponse = await fetch(detailUrl);
        const productDetails = await detailResponse.json();
        
        // ADD THE CONSOLE LOG RIGHT HERE, AFTER GETTING THE PRODUCT DETAILS
        console.log("Product nutrition data:", productDetails.nutrition);
        
        return {
          id: productDetails.id,
          name: productDetails.title,
          brand: productDetails.brand || "Generic",
          image: productDetails.image,
          // Update how we extract nutrition information
          calories: productDetails.nutrition && productDetails.nutrition.nutrients ? 
          productDetails.nutrition.nutrients.find(n => n.name === "Calories")?.amount || 0 : 0,
          protein: productDetails.nutrition && productDetails.nutrition.nutrients ? 
          productDetails.nutrition.nutrients.find(n => n.name === "Protein")?.amount || 0 : 0,
          fat: productDetails.nutrition && productDetails.nutrition.nutrients ? 
          productDetails.nutrition.nutrients.find(n => n.name === "Fat")?.amount || 0 : 0,
          carbs: productDetails.nutrition && productDetails.nutrition.nutrients ? 
          productDetails.nutrition.nutrients.find(n => n.name === "Carbohydrates")?.amount || 0 : 0,
          nutrition: productDetails.nutrition || {},
          ingredients: productDetails.ingredients || "",
          badges: productDetails.badges || [],
          price: productDetails.price || "Varies by store",
          stores: ["Whole Foods", "Trader Joe's", "Target", "Local grocery stores"],
          healthScore: productDetails.healthScore || "N/A",
          dietaryFlags: {
          vegan: productDetails.vegan || false,
          vegetarian: productDetails.vegetarian || false,
          glutenFree: productDetails.glutenFree || false,
          dairyFree: productDetails.dairyFree || false
        }
      };
      } catch (error) {
        console.error(`Error fetching details for product ${product.id}:`, error);
        // Return a simplified version if we can't get details
        return {
          id: product.id,
          name: product.title,
          image: product.image,
          stores: ["Whole Foods", "Trader Joe's", "Target", "Local grocery stores"]
        };
      }
    });
    
    // Wait for all product detail requests to complete
    const enrichedProducts = await Promise.all(productPromises);
    
    res.json({ recommendations: enrichedProducts });
  } catch (error) {
    console.error('Error with Spoonacular API:', error);
    console.log('Falling back to local database');
  
  // Use local database as fallback
  let recommendations = [...snackData.snacks];
  
  // Apply filtering based on request
  if (req.body.diet === 'vegan') {
    recommendations = recommendations.filter(snack => 
      snack.dietaryFlags && snack.dietaryFlags.vegan);
  } else if (req.body.diet === 'vegetarian') {
    recommendations = recommendations.filter(snack => 
      snack.dietaryFlags && snack.dietaryFlags.vegetarian);
  } else if (req.body.diet === 'gluten free') {
    recommendations = recommendations.filter(snack => 
      snack.dietaryFlags && snack.dietaryFlags.glutenFree);
  }
  
  // Apply special filters based on request type
  if (req.body.requestType === "high_protein") {
    recommendations = recommendations.filter(snack => snack.protein >= 10);
  } else if (req.body.requestType === "low_calorie") {
    recommendations = recommendations.filter(snack => snack.calories <= 150);
  }

  // Shuffle the recommendations array to get different results each time
  recommendations = recommendations.sort(() => Math.random() - 0.5);
  
  // Limit to 3-5 random recommendations
  const count = Math.floor(Math.random() * 3) + 3; // Random number between 3-5
  recommendations = recommendations.slice(0, count);

  res.json({ 
    recommendations: recommendations,
    source: 'local',
    message: "Using local database due to API limitations."
  });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server - listen on 0.0.0.0 to make it accessible externally
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});