FROM gcr.io/paradigmxyz/ctf/base:latest

ENV HTTP_PORT=8545

COPY requirements.txt /root

RUN python3 -m pip install -r /root/requirements.txt 

RUN true \
    && curl -L https://foundry.paradigm.xyz | bash \
    && bash -c "source /root/.bashrc && foundryup" \
    && chmod 755 -R /root \
    && true

COPY 98-start-gunicorn /startup

COPY eth_sandbox /usr/lib/python/eth_sandbox

RUN curl https://raw.githubusercontent.com/lunixbochs/mpwn/master/mp.py -o /usr/lib/python/mp.py
RUN curl https://raw.githubusercontent.com/google/kctf/master/docker-images/challenge/pow.py -o /usr/lib/python/pow.py
ENV PYTHONPATH /usr/lib/python

COPY deploy/ /home/ctf/

COPY contracts /tmp/contracts

RUN true \
    && cd /tmp \
    && /root/.foundry/bin/forge build --out /home/ctf/compiled \
    && rm -rf /tmp/contracts \
    && true
