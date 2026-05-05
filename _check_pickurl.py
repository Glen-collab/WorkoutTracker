import sys
sys.path.insert(0, 'C:/Users/big_g/Desktop')
import pi_ssh
pi_ssh.HOST = '192.168.1.36'
cmd = """
echo '--- pick_url body in the file ---'
sed -n '/^pick_url/,/^}/p' /home/pi/.config/labwc/autostart
echo
echo '--- ps tree ---'
pgrep -af labwc
pgrep -af 'chromium' | head -1
echo
echo '--- bash subshells running the loop ---'
ps aux | grep -E 'autostart|while true' | grep -v grep | head -3
"""
pi_ssh.run(cmd, timeout=15)
