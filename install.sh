#!/bin/bash

#Install Newmips app
echo "Starting generator node modules installation..."
npm install

#Create workspace dir
if [ ! -d "$workspace" ]; then
	echo "Create the workspace directory."
	mkdir workspace
	chmod 755 -R workspace
fi

#Install Newmips structure template
echo "Starting template node modules installation..."
cp structure/template/package.json workspace/
cd workspace
npm install

cd ../

if [[ "$OSTYPE" == "linux-gnu" ]]; then
	echo "Linux OS"
	#Create mysql database
	echo "Starting database creation..."
	echo "Please, enter mysql root password: "
	mysql -u root -p < sql/create-database.sql > error.log
	echo "Newmips database created."
elif [[ "$OSTYPE" == "darwin"* ]]; then
	# Mac OSX
	echo "Mac OSX"
	echo "Linux OS"
	#Create mysql database
	echo "Starting database creation..."
	mysql -u root -p < sql/create-database.sql > error.log
	echo "Newmips database created."
elif [[ "$OSTYPE" == "cygwin" ]]; then
	# POSIX compatibility layer and Linux environment emulation for Windows
	echo "cygwin"
elif [[ "$OSTYPE" == "msys" ]]; then
	# Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
	echo "Windows OS"

	echo "Please type the mysql.exe path (Example : c:/wamp/bin/mysql/mysql5.6.17/bin/mysql.exe):"
	read mysqlpath

	echo "Do you have a root password ? (If you are using WAMP you shouldn't have one) type 'Y' or 'N'"
	read havePass

	#Create mysql database
	echo "Starting database creation."

	if [[ "$havePass" == "Y" ]]; then
		echo "Please type your mysql root password:"
		read rootPass
		$mysqlpath -u root -p$rootPass < sql/create-database.sql > error.log
	else
		$mysqlpath -u root < sql/create-database.sql > error.log
	fi

	echo "Newmips database created."

elif [[ "$OSTYPE" == "win32" ]]; then
	# I'm not sure this can happen.
	echo "win32"
	echo "Windows OS"
	echo "Please type the mysql.exe path (Example : c:/wamp/bin/mysql/mysql5.6.17/bin/mysql.exe):"
	read mysqlpath

	#Create mysql database
	echo "Starting database creation..."
	$mysqlpath -u root -p < sql/create-database.sql > error.log

	echo "Newmips database created."
elif [[ "$OSTYPE" == "freebsd"* ]]; then
	echo "freebsd"
else
	echo "Sorry, we can't recognize your Operating System :("
fi

echo "Newmips ready to be started, please type : node server.js"
