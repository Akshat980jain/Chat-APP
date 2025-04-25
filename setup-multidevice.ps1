# PowerShell script to set up chat app for multi-device use

# Get all local IP addresses
$IPs = (Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4" -and $_.PrefixOrigin -ne "WellKnown"}).IPAddress

Write-Host "Found these IP addresses on your system:"
foreach ($ip in $IPs) {
    Write-Host "  - $ip"
}

$selectedIP = $IPs | Select-Object -First 1
Write-Host "Selected IP: $selectedIP"
Write-Host "Setting up server to listen on all interfaces..."

# Update server .env
@"
MONGODB_URI=mongodb+srv://akshat980jain:Akshat%40123@cluster0.fgwy5hs.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=chat_app_secret_key_change_in_production
PORT=5000
"@ | Out-File -FilePath "server\.env" -Encoding ASCII

# Update client .env
@"
GENERATE_SOURCEMAP=false
REACT_APP_API_URL=http://$selectedIP:5000
"@ | Out-File -FilePath "client\.env" -Encoding ASCII

# Create a QR code for easy mobile connection
$qrCodeContent = "http://$selectedIP:5000"
$qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=$qrCodeContent"
Write-Host "QR Code URL for mobile devices: $qrUrl"
Write-Host "Open this URL on your computer and scan the QR code with your mobile device"

Write-Host "Setup complete!"
Write-Host "To start the server, run: cd server; npm install; npm start"
Write-Host "To build the client, run: cd client; npm install; npm run build"
Write-Host "To serve the client on this machine, run: cd client; npx serve -s build"
Write-Host "On other devices, connect to http://$selectedIP:5000" 