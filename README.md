# Newmips

Newmips is a computer aided software that enable to create NodeJS applications with a ChatBot. It is released under AGPL V3 license. Official Website is : <a href="http://www.newmips.com">www.newmips.com</a>

<br><br>

#############################
## Installation instructions #
#############################

Unzip downloaded archive in your working directory.<br>
<code>tar -zxvf newmips_v2.0.tar.gz</code>

Execute the following instructions logged as root or with admin privileges on your computer:<br>
<code>cd working_directory/newmips<br>
./install.sh</code>

<br><br>

##################
## Prerequisites  #
##################

NodeJS v4 minimum
MySQL or MariaDB server installed.

<br><br>

################################
## Documentation                #
################################

Newmips Software documentation is available at http://docs.newmips.com.

<br><br>

################################
## How to start the application #
################################

Command line :
<code>node server.js</code>
or
<code>./start_newmips.sh</code>

Newmips is available on http://127.0.0.1:1337

Notice : to create your first application, ports 9000 and 9001 must be available on your computer.

<br><br>

################################
## How to configure SSL         #
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

<br><br>

################################
## Follow us                    #
################################
<ul>
<li><a href="https://twitter.com/newmips">Twitter</a></li>
<li><a href="https://www.facebook.com/newmips">Facebook</a></li>
</ul>

<br><br>


################################
## License                      #
################################

Newmips is released under the GNU/AGPLv3 license.

<br><br>
