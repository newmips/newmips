FROM node:8.11.3

# Install designer
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Fix for source list error when installing 8.11.3
RUN printf "deb http://archive.debian.org/debian/ jessie main\ndeb-src http://archive.debian.org/debian/ jessie main\ndeb http://security.debian.org jessie/updates main\ndeb-src http://security.debian.org jessie/updates main" > /etc/apt/sources.list

# RUN apt update && apt install unzip
RUN apt-get update && apt-get -qq -y install pdftk && apt-get -y install mysql-client && apt-get -y install nano

# COPY package.json /usr/src/app

COPY . /usr/src/app

# RUN npm install

# RUN cd /usr/src/app/structure/template && npm install

# RUN mkdir -p /usr/src/app/workspace

# RUN mv /usr/src/app/structure/template/node_modules /usr/src/app/workspace/

# RUN cd /usr/src/app/workspace && npm install

VOLUME /usr/src/app/workspace

EXPOSE 1337 9001-9100

ADD entrypoint.sh /
# Setup for ssh onto github
# RUN mkdir -p /root/.ssh

# ADD id_rsa /root/.ssh/id_rsa
# RUN chmod 700 /root/.ssh/id_rsa

# ADD ssh_config /root/.ssh/config

RUN chmod 777 /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
