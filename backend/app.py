from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3, random, string, os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "backend/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

DB = "resolveX.db"

def get_db():
    return sqlite3.connect(DB)

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

# ---------- SUBMIT COMPLAINT (IMAGE ADDED ONLY) ----------
@app.route("/submit", methods=["POST"])
def submit():
    category = request.form.get("category")
    subject = request.form.get("subject")
    description = request.form.get("description")

    image = request.files.get("image")
    filename = None

    if image:
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    cid = "RX" + ''.join(random.choices(string.digits, k=6))

    con = get_db()
    cur = con.cursor()

    cur.execute("""
        INSERT INTO complaints (id, category, subject, description, status, image)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (cid, category, subject, description, "Pending", filename))

    con.commit()
    con.close()

    return jsonify({"complaint_id":cid})

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
            "status": row[4],
            "image": row[5]
        })
    return jsonify({"error":"Invalid ID"}),404

# ---------- SERVE IMAGE ----------
@app.route("/uploads/<filename>")
def uploads(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == "__main__":
    app.run(debug=True)
