# My Mongo Auth Project

This project is a simple authentication system using MongoDB for storing user credentials. It consists of a backend built with Node.js and Express, and a frontend built with React.

## Backend

### Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd my-mongo-auth-project/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the `backend` directory and add your MongoDB connection string:
   ```
   MONGODB_URI=<your-mongodb-connection-string>
   ```

4. Start the server:
   ```
   npm start
   ```

### Endpoints

- **POST /api/auth/register**: Register a new user.
- **POST /api/auth/login**: Log in an existing user.

### Database

The project uses MongoDB to store user credentials. Each user will have a separate database created upon registration.

## Frontend

### Setup

1. Navigate to the frontend directory:
   ```
   cd ../frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend application:
   ```
   npm start
   ```

### Features

- User registration and login.
- Protected routes that require authentication.

## Technologies Used

- Node.js
- Express
- MongoDB
- Mongoose
- React

## License

This project is licensed under the MIT License.