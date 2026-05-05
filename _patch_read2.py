import sys
sys.path.insert(0, 'C:/Users/big_g/Desktop')
import pi_ssh
pi_ssh.HOST = '192.168.1.36'

# Read autostart, replace read_coach_code body, write back.
get_cmd = "cat /home/pi/.config/labwc/autostart"
import paramiko
client = paramiko.SSHClient(); client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.1.36', username='pi', password='pi', timeout=15)
sftp = client.open_sftp()
with sftp.open('/home/pi/.config/labwc/autostart', 'r') as f:
    src = f.read().decode('utf-8')

new_fn = """read_coach_code() {
  # Pure-shell JSON value extractor. Avoids python3 because under memory
  # pressure on a Pi Zero 2 W, python3 sometimes fails to spin up and
  # returns empty — pick_url then falls through to setup-instructions
  # instead of the workout URL.
  if [ -f "$CONFIG_FILE" ]; then
    grep -oE '"coach_code"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" 2>/dev/null \\
      | sed -E 's/.*"coach_code"[[:space:]]*:[[:space:]]*"([^"]*)".*/\\1/' \\
      | head -1
  fi
}"""

import re
patched = re.sub(
    r'read_coach_code\(\)\s*\{[^}]*\}',
    new_fn.replace('\\', '\\\\'),
    src,
    count=1,
    flags=re.DOTALL,
)
if patched == src:
    print('PATCH FAILED — regex did not match')
else:
    with sftp.open('/home/pi/.config/labwc/autostart', 'w') as f:
        f.write(patched)
    print('autostart patched')

sftp.close(); client.close()

# Verify
pi_ssh.run('echo --- new read_coach_code ---; sed -n \"/^read_coach_code/,/^}/p\" /home/pi/.config/labwc/autostart; echo; echo --- live test ---; bash -c \"CONFIG_FILE=/home/pi/bsa-config; \\$(sed -n \\\"/^read_coach_code/,/^}/p\\\" /home/pi/.config/labwc/autostart); read_coach_code\"', timeout=15)
