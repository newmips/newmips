FROM node:8.11.3

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

RUN apt-get update && apt-get -qq -y install pdftk && apt-get -y install mysql-client && apt-get -y install nano

COPY . /usr/src/app

VOLUME /usr/src/app/workspace

EXPOSE 1337 9001 9002 9003 9004 9005 9006 9007 9008 9009 9010

ADD entrypoint.sh /

RUN chmod 777 /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
