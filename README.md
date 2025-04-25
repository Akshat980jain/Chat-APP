# WhatsApp-like MERN Chat Application

A real-time chat application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) that mimics WhatsApp's core functionality.

## Features

- Real-time messaging using Socket.IO
- User authentication (signup/login)
- One-on-one chat
- Online/offline status
- Message status (sent, delivered, read)
- Profile management
- Responsive design

## Tech Stack

- Frontend: React.js, Socket.IO Client
- Backend: Node.js, Express.js, Socket.IO
- Database: MongoDB Atlas (cloud database)
- Authentication: JWT

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for both client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create a `.env` file in the server directory with the following variables:
```
MONGODB_URI=mongodb+srv://akshat980jain:Akshat%40123@cluster0.fgwy5hs.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the application:

```bash
# Start the server (from server directory)
npm start

# Start the client (from client directory)
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000 

## Permanent Solution for Multiple Devices

The app is now configured to work across multiple devices with a cloud-based MongoDB Atlas database. Here's how to set it up:

### Option 1: Deploy to a Cloud Provider (Recommended)

For a truly permanent solution:

1. Deploy the server to a cloud platform like Heroku, Vercel, or Render:
   ```
   # Example for Heroku
   heroku create your-chat-app
   git push heroku main
   ```

2. Update client configuration to point to your cloud server:
   ```
   # In client/.env
   REACT_APP_API_URL=https://your-chat-app.herokuapp.com
   ```

3. Deploy the client to a service like Netlify or Vercel.

This way, your app will be accessible from any device with internet access.

### Option 2: Local Network Setup (Quick Solution)

For accessing within your local network:

1. Run our setup script:
   ```
   # Windows:
   .\setup-multidevice.ps1
   
   # Linux/Mac:
   chmod +x setup-multidevice.sh
   ./setup-multidevice.sh
   ```

2. The script will:
   - Find your local IP address
   - Configure your server to listen on all interfaces
   - Update environment variables
   - Start the server
   - Build the client

3. On other devices, connect to `http://YOUR_COMPUTER_IP:5000`

### Option 3: Ngrok Tunnel (Temporary Solution)

For quick temporary access:

1. Install ngrok: https://ngrok.com/download
2. Start your server on port 5000
3. Create a tunnel:
   ```
   ngrok http 5000
   ```
4. Use the provided ngrok URL to access your server from any device

## Security Considerations

- The MongoDB Atlas database is accessible from any device with internet access
- For production, replace the MongoDB URI with your own and secure it properly
- Consider implementing HTTPS for production deployments

## Troubleshooting

- If you encounter "Cannot connect to database" errors, verify your internet connection
- If server is running but clients can't connect, check firewall settings
- If you're getting CORS errors, make sure the server is properly configured to accept connections from your client domain

## Database Access

The app uses MongoDB Atlas, which allows connections from any device with internet access. No additional configuration is needed for database access.

## Security Notes

This configuration is intended for personal use on a private network. For public deployment, additional security measures should be implemented. 