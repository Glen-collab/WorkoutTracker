import sys
sys.path.insert(0, 'C:/Users/big_g/Desktop')
import pi_ssh
pi_ssh.HOST = '192.168.1.36'
cmd = """
echo '--- before ---'
systemctl is-enabled lightdm 2>/dev/null
systemctl is-active lightdm 2>/dev/null
echo '--- disable + mask lightdm ---'
sudo systemctl stop lightdm 2>/dev/null
sudo systemctl disable lightdm 2>&1 | tail -3
sudo systemctl mask lightdm 2>&1 | tail -1
echo '--- set default target to multi-user (console) ---'
sudo systemctl set-default multi-user.target 2>&1 | tail -2
echo '--- after ---'
systemctl is-enabled lightdm 2>/dev/null
systemctl get-default
echo done
"""
pi_ssh.run(cmd, timeout=30)
