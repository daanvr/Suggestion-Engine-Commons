# Core Functionality 
1. Automatically fetch and display relevant category and depiction suggestions based on the geolocation of uploaded images
2. Retrieve the 50 closest files to the uploaded image's location using the Wikimedia API
3. Display the frequency of category usage in those nearby files
4. Show the distance of each nearby file/category from the uploaded image
5. Use SPARQL queries to fetch and suggest depiction statements from nearby Wikidata items
6. Display suggested depictions in a separate tab with distance and frequency information
7. Allow users to select multiple suggested categories and depictions to add to the image
8. Prevent duplicate categories or depictions from being added
9. Blend suggested items seamlessly into the existing upload interface 
10. Automatically tag uploaded images with "Uploaded by [username] with Suggestion Engine"

# User Interface
11. Display category and depiction suggestions in a floating panel that can be minimized 
12. Use tabs in the floating panel to switch between location-based and frequency-based suggestion lists
13. Show a loading spinner and progress bar for each individual image while its suggestions are being fetched
14. Display the distance and frequency next to each suggested item
15. Visually distinguish suggestions that have already been selected by the user
16. Provide tooltips on key elements like the retry button to guide users
17. Display clear success messages when suggestions load, and error messages if there are issues
18. Inform the user if no suggestions are found for an image, without providing fallback suggestions
19. Allow users to manually clear the suggestion cache

# Error Handling and Performance
20. Round coordinates to 5 decimal places as soon as they are read from the UI
21. Check if coordinates are missing and notify the user if location-based suggestions are unavailable
22. Implement graceful error handling if API calls fail, with clear user notifications 
23. Provide a retry button with a cooldown period to re-attempt failed API calls
24. Cache suggestions based on simplified coordinates to avoid redundant API calls
25. Allow users to enable/disable caching in the configuration 
26. Clear the cache at the start of each new session

# Configuration and Customization 
27. Provide user-configurable options at the top of the script:
    - `USE_CACHE` to enable/disable caching (default: true)
    - `INCLUDE_SUGGESTION_TAG` to enable/disable tagging uploads (default: true) 
    - `RETRY_COOLDOWN` to set the retry button cooldown in ms (default: 3000)
    - `DEBUG_MODE` to enable verbose logging for debugging (default: false)
28. Allow users to disable the automatic upload tagging if desired

# Documentation and Support
29. Include clear setup instructions and a link to the user script installation guide
30. Provide a comprehensive README file explaining the Suggestion Engine's features and usage
31. Add links to the developer's Commons user page and the GitHub repository to encourage user interaction and contributions
32. Encourage users to report issues and suggest enhancements on the GitHub repository  
33. Document and link to any potential "known issues" for quick troubleshooting
34. Add a welcoming message inviting users to contribute to the script's development
35. Include a brief change log in the script's documentation to track updates

# Technical Implementation 
36. Utilize the Wikimedia and Wikidata APIs to retrieve file and item data
37. Use JavaScript to implement all client-side functionality 
38. Integrate the Suggestion Engine into the existing Wikimedia Commons upload UI
39. Follow Wikimedia coding conventions and style guides for consistency
40. Implement a versioning system to track updates
41. Release the script under the open source MIT License
42. Host the script publicly on GitHub for easy access and collaboration
43. Use descriptive and modular functions and logic for readability and extensibility
