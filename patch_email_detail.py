import json

with open("/opt/bestrongagain/workout_api.py", "r") as f:
    content = f.read()

# Find the email section and add workout detail after the stats badges
old = """                        {f'<div style="margin-bottom:16px;">{stats_html}</div>' if stats_html else ''}

                        <div style="font-size:13px;color:#888;border-top:1px solid #f0f0f0;padding-top:12px;">"""

# Build the workout detail section
new = """                        {f'<div style="margin-bottom:16px;">{stats_html}</div>' if stats_html else ''}

                        {build_workout_detail_html(workout_data)}

                        <div style="font-size:13px;color:#888;border-top:1px solid #f0f0f0;padding-top:12px;">"""

content = content.replace(old, new)

# Add the helper function before the log_workout function
old_func = """@workout_bp.route("/log-workout.php", methods=["POST", "OPTIONS"])
def log_workout():"""

new_func = """def build_workout_detail_html(workout_data):
    \"\"\"Build HTML table of exercises with weights/reps and notes.\"\"\"
    if not workout_data or not isinstance(workout_data, dict):
        return ""
    blocks = workout_data.get("blocks", [])
    if not blocks:
        return ""

    block_type_names = {
        'theme': 'Theme', 'warmup': 'Warm Up', 'cooldown': 'Cool Down',
        'straight-set': 'Straight Set', 'superset': 'Superset',
        'triset': 'Triset', 'circuit': 'Circuit', 'conditioning': 'Conditioning',
        'mobility': 'Mobility', 'movement': 'Movement',
    }

    rows = []
    for block in blocks:
        block_type = block.get("type", "")
        if block_type == "theme":
            continue
        type_name = block_type_names.get(block_type, block_type)
        client_notes = block.get("clientNotes", "")

        exercises = block.get("exercises", [])
        if not exercises:
            continue

        rows.append(f'<tr><td colspan="3" style="background:#f3f0ff;font-weight:700;color:#667eea;padding:8px 10px;font-size:13px;border-bottom:1px solid #e5e7eb;">{type_name}</td></tr>')

        for ex in exercises:
            name = ex.get("name", "Unknown")
            sets_count = ex.get("sets", 0)
            target_reps = ex.get("targetReps", "")
            weights = ex.get("weights", [])
            actual_reps = ex.get("actualReps", [])
            recommendation = ex.get("recommendation", "")
            completed = ex.get("completed", False)
            notes = ex.get("notes", "")
            qualifier = ex.get("qualifier", "")

            # Build sets detail
            set_details = []
            for si in range(len(weights) if weights else 0):
                w = weights[si] if si < len(weights) else ""
                r = actual_reps[si] if si < len(actual_reps) else ""
                if w or r:
                    set_details.append(f"{w or '-'} x {r or '-'}")

            sets_str = " | ".join(set_details) if set_details else f"{sets_count}x{target_reps}"
            if qualifier:
                sets_str += f" {qualifier}"

            # Conditioning/cardio
            actual_dur = ex.get("actualDuration", "")
            actual_dist = ex.get("actualDistance", "")
            target_dur = ex.get("targetDuration", "")
            if actual_dur:
                sets_str = f"{actual_dur} min"
                if actual_dist:
                    sets_str += f" / {actual_dist} mi"
            elif target_dur and not set_details:
                sets_str = f"{target_dur} {ex.get('durationUnit', 'min')}"

            # Recommendation arrow
            rec_icon = ""
            if recommendation == "up":
                rec_icon = " \u2b06\ufe0f"
            elif recommendation == "down":
                rec_icon = " \u2b07\ufe0f"
            elif recommendation == "same":
                rec_icon = " \u27a1\ufe0f"

            check = "\u2705 " if completed else ""
            name_style = "color:#333;font-weight:600;" if completed else "color:#888;"

            rows.append(f'<tr><td style="padding:4px 10px;font-size:13px;{name_style}">{check}{name}</td><td style="padding:4px 10px;font-size:13px;color:#555;text-align:right;white-space:nowrap;">{sets_str}{rec_icon}</td></tr>')

            if notes:
                rows.append(f'<tr><td colspan="2" style="padding:2px 10px 6px 28px;font-size:12px;color:#999;font-style:italic;">' + '\U0001F4DD' + f' {notes}</td></tr>')

        if client_notes:
            rows.append(f'<tr><td colspan="2" style="padding:4px 10px 8px 10px;font-size:12px;color:#e65100;background:#fff8e1;">' + '\U0001F4AC' + f' Client notes: {client_notes}</td></tr>')

    if not rows:
        return ""

    return f\"""
        <div style="margin-bottom:16px;">
            <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:6px;">Workout Detail</div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                {''.join(rows)}
            </table>
        </div>
    \"""


@workout_bp.route("/log-workout.php", methods=["POST", "OPTIONS"])
def log_workout():"""

content = content.replace(old_func, new_func)

with open("/opt/bestrongagain/workout_api.py", "w") as f:
    f.write(content)

print("Patched successfully")
