from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, random, string

app = Flask(__name__)
CORS(app)

DB = "resolveX.db"

# ---------- DATABASE SETUP ----------
def get_db():
    return sqlite3.connect(DB)

def init_db():
    con = get_db()
    cur = con.cursor()

    cur.execute("""CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )""")

    cur.execute("""CREATE TABLE IF NOT EXISTS complaints(
        id TEXT PRIMARY KEY,
        category TEXT,
        subject TEXT,
        description TEXT,
        status TEXT
    )""")

    con.commit()
    con.close()

init_db()

# ---------- REGISTER ----------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    con = get_db()
    cur = con.cursor()

    cur.execute("SELECT * FROM users WHERE email=?", (email,))
    if cur.fetchone():
        return jsonify({"error":"Email already exists"}), 400

    cur.execute("INSERT INTO users(email,password) VALUES(?,?)",(email,password))
    con.commit()
    con.close()

    return jsonify({"success":True})

# ---------- LOGIN ----------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    con = get_db()
    cur = con.cursor()

    cur.execute("SELECT * FROM users WHERE email=? AND password=?", (email,password))
    if cur.fetchone():
        return jsonify({"success":True})
    return jsonify({"error":"Invalid credentials"}), 401

@app.route("/submit", methods=["POST"])
def submit():
    data = request.get_json(force=True)

    category = data.get("category")
    subject = data.get("subject")
    description = data.get("description")

    cid = "RX" + ''.join(random.choices(string.digits, k=6))

    con = get_db()
    cur = con.cursor()

    cur.execute("""
        INSERT INTO complaints (id, category, subject, description, status)
        VALUES (?, ?, ?, ?, ?)
    """, (cid, category, subject, description, "Pending"))

    con.commit()
    con.close()

    return jsonify({"complaint_id": cid})

# ---------- DASHBOARD ----------
@app.route("/dashboard-stats")
def dashboard():
    con = get_db()
    cur = con.cursor()

    cur.execute("SELECT COUNT(*) FROM complaints")
    total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM complaints WHERE status='Pending'")
    pending = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM complaints WHERE status='In Progress'")
    progress = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM complaints WHERE status='Resolved'")
    resolved = cur.fetchone()[0]

    con.close()

    return jsonify({
        "total": total,
        "pending": pending,
        "in_progress": progress,
        "resolved": resolved
    })

# ---------- TRACK ----------
@app.route("/track/<cid>")
def track(cid):
    con = get_db()
    cur = con.cursor()

    cur.execute("SELECT * FROM complaints WHERE id=?", (cid,))
    row = cur.fetchone()
    con.close()

    if row:
        return jsonify({
            "id": row[0],
            "category": row[1],
            "subject": row[2],
            "description": row[3],
            "status": row[4]
        })
    return jsonify({"error":"Invalid ID"}),404

if __name__ == "__main__":
    app.run(debug=True)
