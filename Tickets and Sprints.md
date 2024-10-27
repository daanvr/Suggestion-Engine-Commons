# Tickets and Sprints
## Sprint 1: Basic Setup and MVP Foundations
1. Set up basic script structure with placeholders for configuration, functions, and API handling
2. Add configuration section at top with USE_CACHE and default settings 
3. Add basic documentation with version number, purpose, and MIT licensing
4. Implement coordinate retrieval from UI, rounding to 5th decimal immediately
5. Set up simple API call to fetch 50 closest files based on coordinates
6. Display fetched category suggestions in UI (no distance/frequency yet)  
7. Implement simple error handling to notify users if API call fails
8. Add retry button in UI to re-attempt API call on error
9. Implement cooldown period for retry button to prevent excessive requests
10. Test and refine basic setup to ensure core suggestion fetching works

## Sprint 2: Enhancing Suggestion Display 
11. Add distance display next to each category suggestion 
12. Implement frequency counter showing how often each category appears in nearby files
13. Integrate distance and frequency display in UI in a user-friendly way
14. Implement basic loading spinner while suggestions are fetched
15. Display success message when suggestions are successfully loaded 
16. Ensure retry works with new distance and frequency features
17. Add tooltips to key elements like retry button to guide users
18. Write initial cache logic, storing suggestions by simplified coordinates
19. Add config option to enable/disable caching 
20. Test full distance/frequency display for functionality and UX

## Sprint 3: Depiction Suggestions and Caching
21. Implement SPARQL query to fetch nearby Wikidata items for depiction suggestions
22. Display depiction suggestions in separate tab with distance/frequency  
23. Refine caching to support depiction suggestions using simplified coordinates
24. Update configuration to include options for depiction and location suggestions
25. Test caching with multiple files to confirm accuracy  
26. Add message if coordinates are unavailable with fallback explanation
27. Finalize UI display for depiction suggestions distinct from categories
28. Ensure retry works for both category and depiction API calls
29. Add debug mode that logs API call details and errors when enabled
30. Test depiction suggestions fully with caching and retry

## Sprint 4: Tagging, Documentation, Feedback
31. Implement automatic tagging of uploads with "Uploaded with Suggestion Engine"
32. Add config option to disable automatic tagging
33. Create comprehensive documentation explaining features and configuration  
34. Include links to Wikimedia API and SPARQL docs for reference
35. Add link to known GitHub issues for troubleshooting help
36. Encourage contributions with GitHub link and future development message
37. Test tagging is correctly applied on upload  
38. Add loading spinner to each file so suggestions load independently
39. Add diagnostic success/failure messages during suggestion fetching
40. Perform comprehensive test of basic features, tagging, documentation

## Sprint 5: Final Enhancements and Polish
41. Implement cache clear button to allow refreshing suggestions
42. Add visual distinction like checkmark for selected categories 
43. Finalize debug mode with detailed error logs and API responses  
44. Include session-based cache expiration to reset suggestions each session
45. Add comprehensive code comments for readability and maintenance
46. Perform full code review for consistency, best practices
47. Conduct user testing across scenarios with feedback collection
48. Finalize documentation and customization notes
49. Review tooltips and messages for clarity and consistency
50. Prepare script for public release with stable features and versioning
