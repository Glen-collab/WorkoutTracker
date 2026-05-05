with open("/opt/bestrongagain/workout_api.py", "r") as f:
    content = f.read()

# Add clientNote extraction
old = '            notes = ex.get("notes", "")\n            qualifier = ex.get("qualifier", "")'
new = '            notes = ex.get("notes", "")\n            client_note = ex.get("clientNote", "")\n            qualifier = ex.get("qualifier", "")'
content = content.replace(old, new)

# Add client note rendering after trainer notes
old2 = """            if notes:
                rows.append(f'<tr><td colspan="2" style="padding:2px 10px 6px 28px;font-size:12px;color:#999;font-style:italic;">' + '\U0001F4DD' + f' {notes}</td></tr>')"""
new2 = """            if notes:
                rows.append(f'<tr><td colspan="2" style="padding:2px 10px 6px 28px;font-size:12px;color:#999;font-style:italic;">' + '\U0001F4DD' + f' {notes}</td></tr>')

            if client_note:
                rows.append(f'<tr><td colspan="2" style="padding:2px 10px 6px 28px;font-size:12px;color:#e65100;">' + '\U0001F4AC' + f' {client_note}</td></tr>')"""
content = content.replace(old2, new2)

with open("/opt/bestrongagain/workout_api.py", "w") as f:
    f.write(content)
print("Patched client exercise notes")
