#!/bin/bash
# Script to set up chat app for multi-device use

# Function to get all local IP addresses
get_ips() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'
  else
    # Linux/Windows with GitBash
    hostname -I
  fi
}

# Get all IPs and show them
echo "Found these IP addresses on your system:"
all_ips=$(get_ips)
for ip in $all_ips; do
  echo "  - $ip"
done

# Use the first IP by default
IP=$(echo $all_ips | awk '{print $1}')
echo "Selected IP: $IP"
echo "Setting up server to listen on all interfaces..."

# Update server .env
echo "MONGODB_URI=mongodb+srv://akshat980jain:Akshat%40123@cluster0.fgwy5hs.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=chat_app_secret_key_change_in_production
PORT=5000" > server/.env

# Update client .env
echo "GENERATE_SOURCEMAP=false 
REACT_APP_API_URL=http://$IP:5000" > client/.env

# Create QR code for easy mobile connection
QR_URL="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://$IP:5000"
echo "QR Code URL for mobile devices: $QR_URL"
echo "Open this URL on your computer and scan the QR code with your mobile device"

echo "Starting server..."
cd server
npm install
npm start &
SERVER_PID=$!

echo "Building client..."
cd ../client
npm install
npm run build

echo "Setup complete!"
echo "Server is running at http://$IP:5000"
echo "To serve the client on this machine, run: cd client && npx serve -s build"
echo "On other devices, connect to http://$IP:5000"
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for Ctrl+C
trap "kill $SERVER_PID; exit" INT
wait 