import sys
sys.path.insert(0, 'C:/Users/big_g/Desktop')
import pi_ssh
pi_ssh.HOST = '192.168.1.36'
# Replace the pick_url function with one that just trusts bsa-config.
cmd = """
sudo -u pi python3 - <<'PY'
import re, pathlib
p = pathlib.Path('/home/pi/.config/labwc/autostart')
src = p.read_text()
new_fn = '''pick_url() {
  local CC
  CC=$(read_coach_code)
  if [ -z "$CC" ]; then
    echo "$SETUP_URL"
    return
  fi
  echo "${WORKOUT_URL_TEMPLATE/__CC__/$CC}"
}'''
src = re.sub(r'pick_url\\(\\)\\s*\\{[\\s\\S]*?^\\}', new_fn, src, count=1, flags=re.MULTILINE)
p.write_text(src)
print('autostart patched')
PY
echo '--- new pick_url ---'
sed -n '/^pick_url/,/^}/p' /home/pi/.config/labwc/autostart
echo
echo '--- restarting kiosk loop ---'
sudo pkill -f labwc 2>/dev/null
sleep 2
echo done
"""
pi_ssh.run(cmd, timeout=20)
