#!/bin/bash

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
cd structure/template
npm install

cd ../../

if [[ "$OSTYPE" == "linux-gnu" ]]; then
	echo "Linux OS"
	#Create mysql database
	echo "Starting database creation"
	echo "Please, enter mysql root password: "
	mysql -u root -p < sql/00-create-database.sql > error.log

	echo "Database newmips created"

	#Create newmips database
	echo "Starting schema newmips creation"
	mysql -u newmips -pnewmips -h127.0.0.1 newmips < sql/01-newmips-bdd.sql
	mysql -u newmips -pnewmips -h127.0.0.1 newmips < sql/02-tablesreferences.sql
elif [[ "$OSTYPE" == "darwin"* ]]; then
	# Mac OSX
	echo "Mac OSX"
	echo "Linux OS"
	#Create mysql database
	echo "Starting database creation"
	mysql -u root -p < sql/00-create-database.sql > error.log

	echo "Database newmips created"

	#Create newmips database
	echo "Starting schema newmips creation"
	mysql -u newmips -pnewmips -h127.0.0.1 newmips < sql/01-newmips-bdd.sql
	mysql -u newmips -pnewmips -h127.0.0.1 newmips < sql/02-tablesreferences.sql

elif [[ "$OSTYPE" == "cygwin" ]]; then
	# POSIX compatibility layer and Linux environment emulation for Windows
	echo "cygwin"
elif [[ "$OSTYPE" == "msys" ]]; then
	# Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
	echo "Windows OS"

	echo "Please type the mysql.exe path (Maybe something like : c:/wamp/bin/mysql/mysql5.6.17/bin/mysql.exe)"
	read mysqlpath

	echo "Do you have a root password ? (If you are using WAMP you shouldn't have one) type 'Yes' or 'No'"
	read havePass

	if [[ "$havePass" == "Yes" ]]; then
		echo "Please type your mysql root password"
		read rootPass

		#Create mysql database
		echo "Starting database creation"
		$mysqlpath -u root -p$rootPass < sql/00-create-database.sql > error.log

	else
		#Create mysql database
		echo "Starting database creation"
		$mysqlpath -u root < sql/00-create-database.sql > error.log
	fi

	echo "Database newmips created"

	#Create newmips database
	echo "Starting schema newmips creation"
	$mysqlpath -u newmips -pnewmips -h127.0.0.1 newmips < sql/01-newmips-bdd.sql
	$mysqlpath -u newmips -pnewmips -h127.0.0.1 newmips < sql/02-tablesreferences.sql

elif [[ "$OSTYPE" == "win32" ]]; then
	# I'm not sure this can happen.
	echo "win32"
	echo "Windows OS"
	echo "Please type the mysql.exe path"

	read mysqlpath

	#Create mysql database
	echo "Starting database creation"
	$mysqlpath -u root -p < sql/00-create-database.sql > error.log

	echo "Database newmips created"

	#Create newmips database
	echo "Starting schema newmips creation"
	$mysqlpath -u newmips -pnewmips -h127.0.0.1 newmips < sql/01-newmips-bdd.sql
	$mysqlpath -u newmips -pnewmips -h127.0.0.1 newmips < sql/02-tablesreferences.sql
elif [[ "$OSTYPE" == "freebsd"* ]]; then
	echo "freebsd"
else
	echo "Sorry, we can't recognize your Operating System :("
fi

echo "Newmips ready to be started -> node server.js"
