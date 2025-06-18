#!/bin/sh

mkdir /var/run/sshd
sed -ri 's/#?PermitRootLogin\s.*$/PermitRootLogin yes/' /etc/ssh/sshd_config
echo "root:${ROOT_PASSWORD}" | chpasswd

exec /usr/bin/supervisord -c /etc/supervisord.conf
