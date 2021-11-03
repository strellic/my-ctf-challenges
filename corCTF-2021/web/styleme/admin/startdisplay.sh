export DISPLAY=:99.0
export PUPPETEER_EXEC_PATH="google-chrome-stable"

while true
do
    Xvfb -ac :99 -screen 0 1280x1024x16 > /dev/null 2>&1
done