# Cake Ordering Website

A full-stack cake ordering website with user and admin interfaces. Built with React frontend and Node.js/Express backend.

## Features

### User Features
- Browse cake catalog with beautiful images
- Add products to shopping cart
- Manage cart items (add, remove, update quantity)
- Place orders with customer details
- Select delivery date and time
- Payment method selection (PhonePe, GPay icons)
- Order confirmation

### Admin Features
- Secure admin login with JWT authentication
- View all orders with customer details
- See delivery information (date, time, address)
- Update order status (pending, confirmed, preparing, delivered, cancelled)
- Filter orders by status
- View detailed order information including items and totals

## Technology Stack

- **Frontend**: React, React Router, Context API, Axios, Vite
- **Backend**: Node.js, Express, Sequelize ORM
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Custom CSS with modern gradients and animations

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```
PORT=5000
DB_HOST=localhost
DB_NAME=cake_ordering
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

4. Make sure PostgreSQL is running and create the database:
```sql
CREATE DATABASE cake_ordering;
```

5. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will automatically:
- Create database tables
- Seed initial cake products
- Create default admin user (username: `admin`, password: `admin123`)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

**Important**: Change the default admin password in production!

## Project Structure

```
MahaSri/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── User.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── auth.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product

### Orders
- `POST /api/orders` - Create new order (public)
- `GET /api/orders` - Get all orders (admin only)
- `GET /api/orders/:id` - Get single order (admin only)
- `PATCH /api/orders/:id/status` - Update order status (admin only)

### Authentication
- `POST /api/auth/login` - Admin login

## Design Features

- Modern gradient-based color scheme
- Smooth animations and transitions
- Fully responsive design (mobile, tablet, desktop)
- Unique card-based layouts
- Interactive hover effects
- Beautiful typography with Poppins font

## Notes

- Cake images are loaded from online sources (Unsplash)
- Cart is persisted in browser localStorage
- Payment icons are visual only (no actual payment processing)
- All orders are stored in PostgreSQL database

## License

ISC


