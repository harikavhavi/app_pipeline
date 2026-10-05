import sqlite3, json

conn = sqlite3.connect("parasync.db")
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("TABLES:", cur.fetchall())

cur.execute("SELECT id, name, sport, ipc_class FROM athletes")
athletes = cur.fetchall()
print(f"\nATHLETES ({len(athletes)} rows):")
for a in athletes:
    print(" ", a)

cur.execute("SELECT id, athlete_id, sport, total_metric_cards, date FROM sessions")
sessions = cur.fetchall()
print(f"\nSESSIONS ({len(sessions)} rows):")
for s in sessions:
    print(" ", s)

conn.close()
print("\nDONE")
