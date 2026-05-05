import sys, time
sys.path.insert(0, 'C:/Users/big_g/Desktop')
import pi_ssh
pi_ssh.HOST = '192.168.1.36'
cmd = """
echo '--- killing all labwc + chromium so the loop respawns from a clean script read ---'
sudo pkill -f labwc
sudo pkill -9 chromium
sleep 4
echo '--- after kill, fresh respawn ---'
sleep 6
tail -3 /tmp/kiosk-respawn.log
echo '--- chromium should now be on workout URL ---'
ps -o cmd= -p $(pgrep -f 'chromium --force' | head -1) 2>/dev/null | head -c 200
echo
"""
pi_ssh.run(cmd, timeout=30)
