import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import registrationRoutes from './routes/registrationRoutes';
import collegeRoutes from './routes/collegeRoutes';
import sequelize from './models/index'; // Import the Sequelize instance

dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port, default to 3000

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connected successfully');
    })
    .catch((err: Error) => {
        console.error('Database connection error:', err);
        process.exit(1); // Exit process if database connection fails
    });

// Routes
app.use('/api/registrations', registrationRoutes);
app.use('/api/colleges', collegeRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Log the error
    console.error(`Error: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
  
    // Send a generic error message to the client
    res.status(500).json({ message: 'Internal Server Error' });
});
  
// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
