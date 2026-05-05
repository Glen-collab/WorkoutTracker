import sys
sys.path.insert(0, 'C:/Users/big_g/Desktop')
import pi_ssh
pi_ssh.HOST = '192.168.1.36'
cmd = """
sudo -u pi python3 - <<'PY'
import re, pathlib
p = pathlib.Path('/home/pi/.config/labwc/autostart')
src = p.read_text()
new_fn = '''read_coach_code() {
  # Pure-shell JSON value extractor — no python3, so it cannot fail under
  # memory pressure on a Pi Zero 2 W (which was happening: python failed
  # to start cleanly, returned empty, and pick_url fell through to
  # setup-instructions.html instead of the workout URL).
  if [ -f "$CONFIG_FILE" ]; then
    grep -oE '\"coach_code\"[[:space:]]*:[[:space:]]*\"[^\"]*\"' "$CONFIG_FILE" \\
      | sed 's/.*:[[:space:]]*\"\\(.*\\)\"/\\\\1/' \\
      | head -1
  fi
}'''
src = re.sub(r'read_coach_code\\(\\)\\s*\\{[\\s\\S]*?^\\}', new_fn, src, count=1, flags=re.MULTILINE)
p.write_text(src)
print('autostart patched')
PY
echo '--- new read_coach_code ---'
sed -n '/^read_coach_code/,/^}/p' /home/pi/.config/labwc/autostart
echo
echo '--- live test ---'
bash -c 'CONFIG_FILE=/home/pi/bsa-config; '"$(sed -n '/^read_coach_code/,/^}/p' /home/pi/.config/labwc/autostart)"'; read_coach_code'
"""
pi_ssh.run(cmd, timeout=15)
