from flask import Flask, session, request, flash, redirect, url_for, render_template
import hashlib
import secrets
import sqlite3
import os

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", secrets.token_hex(16))

conn = sqlite3.connect("iframe-note.db", isolation_level=None)

cursor = conn.cursor()
cursor.execute('pragma journal_mode=WAL')
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY, password TEXT NOT NULL
);
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS iframes (
    id TEXT PRIMARY KEY, author TEXT NOT NULL, name TEXT NOT NULL, url TEXT NOT NULL, style TEXT
);
""")
cursor.close()

def add_user(username, password):
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashlib.sha256(password.encode()).hexdigest()))
    cursor.close()

def add_iframe(author, name, url, style = None):
    cursor = conn.cursor()
    cursor.execute("INSERT INTO iframes (id, author, name, url, style) VALUES (?, ?, ?, ?, ?)", (secrets.token_hex(16), author, name, url, style))
    cursor.close()

def get_iframe(id):
    cursor = conn.cursor()
    iframe = cursor.execute("SELECT name, url, style FROM iframes WHERE id = ?", (id,)).fetchone()
    cursor.close()
    return iframe

def get_iframes(author):
    cursor = conn.cursor()
    iframes = cursor.execute("SELECT id, name FROM iframes WHERE author = ?", (author,)).fetchall()
    cursor.close()
    return iframes

def get_user(username):
    cursor = conn.cursor()
    user = cursor.execute("SELECT username, password FROM users WHERE username = ?", (username,)).fetchone()
    cursor.close()
    return user

# might fail since multiple workers try to all add admin
try:
    add_user("admin", os.getenv("ADMIN_PASSWORD", "erm"))
except:
    pass

@app.get("/")
def index():
    if session.get("user"):
        iframes = get_iframes(session["user"])
        return render_template("home.html", user=session["user"], iframes=iframes)
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username, password = request.form["username"], request.form["password"]
        user = get_user(username)
    
        if user and user[1] == hashlib.sha256(password.encode()).hexdigest():
            session["user"] = username
            return redirect(url_for("index"))

        flash("invalid username or password", "error")
        return redirect(url_for("login"))
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username, password = request.form["username"], request.form["password"]

        if len(username) < 5 or len(password) < 7:
            flash("username must be at least 5 characters long and password must be at least 7 characters long", "error")
            return redirect(url_for("register"))
        
        if not username.isalnum():
            flash("username must be alphanumeric", "error")
            return redirect(url_for("register"))

        if username in password:
            flash("username cannot be contained in the password", "error")
            return redirect(url_for("register"))

        if get_user(username):
            flash("username already taken", "error")
            return redirect(url_for("register"))
        
        add_user(username, password)
        session["user"] = username

        return redirect(url_for("index"))
    return render_template("register.html")

@app.post("/create")
def create():
    if not session.get("user"):
        flash("you must be logged in to create an iframe", "error")
        return redirect(url_for("index"))
    
    if session["user"] == "admin":
        flash("admin cannot create iframes", "error")
        return redirect(url_for("index"))

    name, url, style = request.form["name"], request.form["url"], request.form["style"]

    if not name or not url:
        flash("name and url cannot be empty", "error")
        return redirect(url_for("index"))

    if not url.lower().startswith("http"):
        flash("url must start with http or https", "error")
        return redirect(url_for("index"))
    
    add_iframe(session["user"], name, url, style)
    return redirect(url_for("index"))

@app.get("/view")
def view():
    return render_template("view.html")

@app.get("/iframe/<id>")
def iframe(id):
    iframe = get_iframe(id)
    if not iframe:
        return { "error": "iframe not found" }
    return { "name": iframe[0], "url": iframe[1], "style": iframe[2] }