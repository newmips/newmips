#!/bin/bash

sleep 20

# Set Git user and email
git config --global user.name "$HOSTNAME"
git config --global user.email "$SUB_DOMAIN@$DOMAIN_STUDIO"

# Write SSH Config file
printf "Host gitlab.%s\n    Port 22\n    StrictHostKeyChecking no\n" "$DOMAIN_STUDIO" > /root/.ssh/config
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa

npm start