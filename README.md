# RESTful-API

This project encompasses the development of a feature-rich RESTful API for a Yelp-like application, integrating various functionalities such as file storage, database management, user authentication, and authorization. The API is designed to handle businesses, reviews, and photos with an emphasis on scalability, security, and adherence to best practices.

****Project Components****
**1. File Storage**
Implemented a file storage system for photo uploads, supporting image formats such as JPEG and PNG.
Utilized GridFS in MongoDB to store image files alongside metadata, allowing for efficient retrieval and management.
**2. Database Integration**
Incorporated MySQL or MongoDB to power the backend database for storing businesses, reviews, and photos.
Initialized and organized the database using Docker containers with environment variables for configuration.
Established relationships and associations within the database schema, ensuring seamless access and retrieval of interconnected data.
**3. Authorization and Authentication**
Implemented user registration with a POST /users endpoint, securely hashing and salting passwords before storage.
Enabled JWT-based user logins with a POST /users/login endpoint, issuing tokens for subsequent authenticated requests.
Established user-specific data access endpoints (GET /users/{userId}) and enforced authorization for various API actions, restricting access based on user roles.
Ensured only admin users can create other admin users and that all authorized endpoints respond appropriately to unauthorized or unauthenticated requests.
**4. API Design and Testing**
Developed a RESTful API with modularized routes, utilizing Node.js, Express, and Sequelize or MongoDB, depending on the project.
Implemented basic tests for each API endpoint using tools such as Postman or cURL, ensuring comprehensive functionality coverage.
Containerized the API server using Docker for streamlined deployment and accessibility.






