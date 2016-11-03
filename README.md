# Newmips

Newmips is a computer aided software that enable to create your own NodeJS applications talking to a Bot. It is released under AGPL V3 license.



#############################
# Installation instructions #
#############################

Unzip downloaded archive in your working directory.
<code>tar -zxvf newmips_v2.0.tar.gz</code>

Execute the following instructions logged as root or with admin privileges on your computer:
<code>cd working_directory/newmips<br>
./install.sh</code>

##################
# Prerequisites  #
##################

NodeJS v4 minimum
MySQL or MariaDB server installed.


################################
# Documentation                #
################################

Newmips Software documentation is available at http://docs.newmips.com.


################################
# How to start the application #
################################

Command line :
<code>node server.js</code>
or
<code>./start_newmips.sh</code>

Newmips is available on http://127.0.0.1:1337

Notice : to create your first application, ports 9000 and 9001 must be available on your computer.



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


################################
# Follow us                    #
################################
<ul>
<li><a href="https://twitter.com/newmips">Twitter</a></li>
<li><a href="https://www.facebook.com/newmips">Facebook</a></li>
</ul>


################################
# License                      #
################################

Newmips is released under the GNU/AGPLv3 license.
