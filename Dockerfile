FROM node:argon

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install

COPY . /usr/src/app

RUN cd /usr/src/app/structure/template && npm install

EXPOSE 1337

CMD ["npm", "start"]
