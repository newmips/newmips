# Newmips

Newmips is a computer aided software that enable to create your own NodeJS applications talking to a Bot. It is released under AGPL V3 license.

Software documentation is available at http://docs.newmips.com.

#############################
# Installation instructions #
#############################

Unzip downloaded archive in your working directory.
tar -zxvf newmips_v2.0.tar.gz

Execute the following instructions logged as root or with admin privileges on your computer:
cd working_directory/newmips
./install.sh

##################
# Prerequisites  #
##################
 node v4 minimum
 mysql or mariadb server installed.

################################
# How to start the application #
################################
Command line : node server.js
or ./start_newmips.sh

Newmips is available on http://127.0.0.1:1337

Notice : to create the first application, port 9000 and 9001 have to be available on your computer.


################################
# How to configure SSL         #
################################

In config/global.js, set the protocol to https.
Default configuation is http and develop environment.

Edit the server.js file and configure properly the variables for your HTTPS server :
- set the complete path to your private.key file ( fill in the key option )
- set the complete path to your ssl certificat ( fill in the cert option )
- set your passphrase ( fill in the passphrase option )

Example :
https.createServer({
	  key: fs.readFileSync('./cacerts/private.key'),
	  cert: fs.readFileSync('./cacerts/yoursslcertificat.crt'),
	  passphrase : 'yourpassphrase'
	}, app).listen(port);
