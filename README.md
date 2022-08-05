<p align="center">
	<img width="280" height="125" src="https://www.newmips.com/assets/img/logos/logo_newmips_blanc.png">
</p>
<br>
<p align="center">⚠ Newmips generator is no longer maintained! ⚠ <br>Thank you for heading to the new version which is now called Nodea Software!<br> https://github.com/nodea-software/nodea </p>
<br>

# Newmips

Newmips is a computer aided software that enable to generate NodeJS applications by giving instructions to a bot.<br>
Official Website is : https://newmips.com

<br><br>
## Classic Installation

### Prerequisites

NodeJS >= 8.11.3<br>
MySQL / MariaDB or Postgres server installed and running.

### Instructions

Download and unzip the following archive in your working directory : https://github.com/newmips/newmips/archive/master.zip<br>
Or git clone: <pre>git clone git@github.com:newmips/newmips.git</pre>

Execute the following instructions:<br/>
<pre>
cd NEWMIPS_FOLDER
chmod +x install.sh
bash install.sh
</pre>

Follow the instructions and wait for message :<br>
<i>Newmips ready to be started -> node server.js</i>

Then, execute command line :
<pre>
node server.js
</pre>

Open your browser on http://127.0.0.1:1337<br>
Set your password on the first connection page http://127.0.0.1:1337/first_connection?login=admin<br>
The default generator login is: <b>admin</b>

Note : to create your first application, ports <i>9000</i> and <i>9001</i> must be available on your computer.

<br><br>
## Docker Installation

### Prerequisites

Docker and Docker compose installed

### Instructions

Create (and adapt if necessary) "docker-compose.yml" file:

<pre>
version: '3.5'

services:
  newmips:
	depends_on:
	  - database
	image: newmips/newmips:latest
	networks:
	  proxy:
		ipv4_address: 172.21.0.14
	ports:
	  - "1337:1337"
	  - "9001-9100:9001-9100"
	environment:
	  SERVER_IP: "172.21.0.14"
	  DATABASE_IP: "172.21.0.15"
  database:
	image: newmips/newmips-mysql:latest
	networks:
	  proxy:
		ipv4_address: 172.21.0.15
	volumes:
	  - db_data:/var/lib/mysql
	ports:
	  - "3306:3306"
	environment:
	  MYSQL_ROOT_PASSWORD: P@ssw0rd+
	  MYSQL_DATABASE: newmips
	  MYSQL_USER: newmips
	  MYSQL_PASSWORD: newmips

networks:
  proxy:
	ipam:
	  driver: default
	  config:
		- subnet: 172.21.0.0/24

volumes:
  db_data: {}
</pre>

Execute Docker compose command:
<pre>
sudo docker-compose -f docker-compose.yml -p studio up -d
</pre>

Wait about 30 seconds and open your browser on http://127.0.0.1:1337<br>
Set your password on the first connection page http://127.0.0.1:1337/first_connection?login=admin<br>
The default generator login is: admin

Note : to set up Newmips docker containers, range ports <i>9001</i> to <i>9100</i> must be available on your computer.

<br><br>
## Documentation

Newmips software documentation is available at : https://docs.newmips.com.

## Follow us

<ul>
<li><a href="https://twitter.com/newmips">Twitter</a></li>
<li><a href="https://www.linkedin.com/company/newmips">LinkedIn</a></li>
</ul>

## License

Newmips is released under the GNU GPL v3.0 license.
It contains several open source components distributed under the MIT, BSD or GNU GPL V3.0 licenses.
