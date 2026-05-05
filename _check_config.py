import sys
sys.path.insert(0, 'C:/Users/big_g/Desktop')
import pi_ssh
pi_ssh.HOST = '192.168.1.36'
cmd = """
echo '--- bsa-config contents ---'
cat /home/pi/bsa-config 2>/dev/null
echo
echo '--- coach code parse test ---'
python3 -c "import json; print('parsed:', json.load(open('/home/pi/bsa-config')).get('coach_code',''))" 2>&1
echo
echo '--- last 5 respawn entries ---'
tail -5 /tmp/kiosk-respawn.log
"""
pi_ssh.run(cmd, timeout=15)
