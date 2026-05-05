import sys
sys.path.insert(0, 'C:/Users/big_g/Desktop')
import pi_ssh
pi_ssh.HOST = '192.168.1.36'
cmd = """
echo '--- chromium running ---'
pgrep -af chromium >/dev/null && echo YES || echo NO
echo '--- last 12 respawn entries ---'
tail -12 /tmp/kiosk-respawn.log
echo
echo '--- current memory ---'
free -m
echo
echo '--- OOM in dmesg ---'
sudo dmesg | grep -iE 'oom|killed.process|chromium' | tail -3
echo
echo '--- chromium exit reasons (latest) ---'
sudo journalctl --since '5 minutes ago' --no-pager 2>&1 | grep -iE 'chromium|signal|killed|labwc' | tail -10
"""
pi_ssh.run(cmd, timeout=20)
