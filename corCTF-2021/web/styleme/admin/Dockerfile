FROM node:12.10.0

RUN  apt-get update \
     && apt-get install -yq libgconf-2-4 \
     && apt-get install -y wget xvfb --no-install-recommends \
     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
     && apt-get update \
     && apt-get install -y google-chrome-stable --no-install-recommends \
     && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /usr/src/app

COPY package.json .

RUN npm install

COPY . .

RUN useradd -ms /bin/bash app

RUN chown app:app /usr/src/app
RUN chmod +x entrypoint.sh
RUN chmod +x startdisplay.sh

USER app

CMD ["./entrypoint.sh"]
