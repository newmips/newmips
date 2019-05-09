#!/bin/bash

sleep 60

#Install Newmips app
echo "Starting generator nodes modules installation"
npm install

#Create workspace dir
if [ ! -d "$workspace" ]; then
        echo "Create the workspace directory"
        mkdir workspace
        chmod 755 -R workspace
fi

#Install Newmips structure template
echo "Starting template nodes modules installation"
cp structure/template/package.json workspace/
cd workspace
npm install

cd ..
npm start