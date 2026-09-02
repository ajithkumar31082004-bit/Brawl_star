#!/bin/bash
set -e

# Update packages
apt-get update -y
apt-get upgrade -y

# Install prerequisites
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git nginx

# Install Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable & start Docker
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# Setup Project Directory
mkdir -p /opt/battleverse
chown -R ubuntu:ubuntu /opt/battleverse

# Setup Nginx Reverse Proxy for Battleverse
cat <<'EOF' > /etc/nginx/sites-available/battleverse
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    # Frontend SPA
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend REST API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket / Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Link Nginx site and reload
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/battleverse /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "Battleverse EC2 Server Initialization Complete!"
