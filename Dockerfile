<<<<<<< HEAD
FROM quay.io/gurusensei/gurubhay:latest

RUN git clone https://github.com/SilvaTechB/silva-md-bot /root/sylivanus

WORKDIR /root/sylivanus/

RUN npm install --platform=linuxmusl

EXPOSE 5000

CMD ["npm", "start"]
=======
FROM node:20-buster

RUN apt-get update && \
  apt-get install -y \
  ffmpeg \
  imagemagick \
  webp && \
  apt-get upgrade -y && \
  rm -rf /var/lib/apt/lists/*

COPY package.json .

RUN npm install && npm install qrcode-terminal

COPY . .

EXPOSE 5000

CMD ["node", "silva.js"]
>>>>>>> a5ad72cbcf4e1685bb7ca81f056aee180f08b9f5
