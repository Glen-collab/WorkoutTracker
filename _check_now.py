import sys
sys.path.insert(0, 'C:/Users/big_g/Desktop')
import pi_ssh
pi_ssh.HOST = '192.168.1.36'
cmd = """
echo '--- chromium running? ---'
pgrep -af 'chromium --' >/dev/null && echo YES || echo NO
echo
echo '--- last 8 respawn entries ---'
tail -8 /tmp/kiosk-respawn.log
echo
echo '--- current chromium URL ---'
ps -o args= -p $(pgrep -f 'chromium --' | head -1) 2>/dev/null | grep -oE 'https?://[^ ]+|file://[^ ]+' | head -1
echo
echo '--- memory ---'
free -m | head -2
echo
echo '--- service worker hash check (do we have new bundle?) ---'
curl -sS https://bestrongagain.netlify.app/dist/tracker.js 2>/dev/null | head -c 80; echo
"""
pi_ssh.run(cmd, timeout=15)
