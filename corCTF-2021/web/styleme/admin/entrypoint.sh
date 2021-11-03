export DISPLAY=:99.0
export PUPPETEER_EXEC_PATH="google-chrome-stable"

bash startdisplay.sh &

while true
do
    node index.js
done