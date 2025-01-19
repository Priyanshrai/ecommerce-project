# E-commerce Order Management System

A full-stack application for managing orders built with Node.js, React, and PostgreSQL.

## Features

- View all orders with their products
- Create new orders
- Edit existing orders
- Delete orders
- Search orders by ID or description
- Select multiple products for each order

## Tech Stack

- Backend: Node.js with Express
- Frontend: React with Material-UI
- Database: PostgreSQL

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Setup Instructions

### Database Setup

1. Create a PostgreSQL database named `ecommerce`
2. Run the SQL commands from `database/schema.sql` to create tables and insert initial data

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with your PostgreSQL credentials:
   ```
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ecommerce
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   node server.js
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## API Endpoints

- GET `/api/order` - Get all orders
- GET `/api/order/:id` - Get order by ID
- POST `/api/orders` - Create new order
- PUT `/api/orders/:id` - Update order
- DELETE `/api/orders/:id` - Delete order

## Notes

- The frontend is configured to connect to the backend at `http://localhost:5000`
- Make sure both the backend server and PostgreSQL database are running before starting the frontend
- The initial product data is loaded automatically when running the database schema 