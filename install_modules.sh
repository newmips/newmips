#Install Newmips generator node modules
echo "INSTALLING GENERATOR NODE MODULES..."
npm install

#Create workspace dir
if [ ! -d "$workspace" ]; then
        echo "GENERATE WORKSPACE DIRECTORY..."
        mkdir workspace
        chmod 755 -R workspace
fi

#Install Newmips structure template
echo "INSTALLING WORKSPACE NODE MODULES..."
cp structure/template/package.json workspace/
cd workspace
npm install