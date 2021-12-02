import sqlite3
from sqlite3.dbapi2 import Cursor
from flask import Flask, flash, redirect, render_template, request, session
from werkzeug.security import check_password_hash, generate_password_hash
import os
import mimetypes
from pathlib import Path
from functools import wraps
from mutagen.mp3 import MP3


app = Flask(__name__)
key = os.urandom(12)
app.secret_key = key

session = {}


def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/1.1.x/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/other")
        return f(*args, **kwargs)
    return decorated_function

# def insertfile(username, file, name):
#     connection = sqlite3.connect('beatsbits.db')
#     cursor = connection.cursor()
#     user = session["username"]
#     query = "INSERT INTO sounds (user, path, name) VALUES (?, ?, ?)"
#     path = "/static/resources/sounds/" + username
#     if not os.path.exists(path):
#         os.mkdir("/static/resources/sounds/", username)
#     # save file
#     filename= "sound" + str(len(os.listdir(path))+1)
#     path = path + filename
#     data = (user, path, name)
#     cursor.execute(query, data)
#     connection.commit()
#     cursor.close()


def insertuser(name, hash):
    connection = sqlite3.connect('beatsbits.db')
    cursor = connection.cursor()
    query = "INSERT INTO users (username, hash) VALUES (?, ?)"
    data = (name, hash)
    cursor.execute(query, data)
    connection.commit()
    cursor.close()
    session["user_id"] = sql2dict("SELECT id FROM users WHERE username = ?", [name])[0]["id"]




def sql2dict(query, args=[]):
    connection = sqlite3.connect('beatsbits.db')
    cursor = connection.cursor()
    cursor.execute(query, args)
    r = cursor.fetchall()
    records = []
    columnNames = [column[0] for column in cursor.description]
    for record in r:
        records.append(dict(zip(columnNames, record)))
    cursor.close()
    return records

def removeSound(name):
    query = "SELECT path FROM sounds WHERE name = ?"
    args = [name]
    path = sql2dict(query, args)[0]["path"]
    connection = sqlite3.connect('beatsbits.db')
    cursor = connection.cursor()
    query = "DELETE FROM sounds WHERE name = ?"
    cursor.execute(query, args)
    connection.commit()
    cursor.close()
    if os.path.exists(path):
        os.remove(path)


def insertSound(name, type):
    filename = name.replace(" ", "_")
    username = sql2dict("SELECT username FROM users WHERE id = ?", [
                        session["user_id"]])[0]["username"]
    path = Path("static/resources/sounds") 
    filename = filename + type
    savedir = path / username
    if not os.path.exists(savedir):
        os.mkdir(savedir)
    endpath = savedir / filename
    connection = sqlite3.connect('beatsbits.db')
    cursor = connection.cursor()
    query = "INSERT INTO sounds (path, user, name) VALUES (?, ?, ?)"
    
    data = (str(endpath), session["user_id"], name)
    cursor.execute(query, data)
    connection.commit()
    cursor.close()
    return endpath




@app.route("/")
def index():
    return render_template("start.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    session.clear()
    if request.method == "GET":
        return render_template("login.html")
    if request.method == "POST":
        username = request.form["name"]
        if username == "" or request.form["password"] == "":
            error = "username and password did not match"
            return render_template("login.html", error=error)
        query = "SELECT * FROM users WHERE username = ?"
        userdata = sql2dict(query, [username])
        if len(userdata) != 1:
            error = "invalid username"
            return render_template("login.html", error=error)
        hash = userdata[0]["hash"]
        password = request.form["password"]
        if not check_password_hash(hash , password):
            error = "username and password did not match"
            return render_template("login.html", error=error)
        session["user_id"] = userdata[0]["id"]
        return redirect("/other")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")
    if request.method == "POST":
        username = request.form["name"] 
        if not username or not request.form["password"] or not request.form["confirm"]:
            error = "not all fields are filled in"
            return render_template("register.html", error=error)
        if request.form["password"] != request.form["confirm"]:
            error = "passwords dont match"
            return render_template("register.html", error=error)
        query = "SELECT id FROM users WHERE username = ?"
        if len(sql2dict(query, [username])) > 0:
            error = "username is already taken"
            return render_template("register.html", error=error)
        hash = generate_password_hash(request.form["password"])
        insertuser(username, hash)
        return redirect("/other")

@app.route("/other")
def other():
    userdata = []
    query = "SELECT * FROM sounds WHERE user = ?"
    blocks = sql2dict(query, [1]) #user_id 1 = system
    if session.get("user_id") is None:
        login = False
    else:
        login = True
        userdata = sql2dict(query, [session["user_id"]])
    return render_template("other.html", blocks=blocks, userdata=userdata, login=login)


@app.route("/create", methods=["GET", "POST"])
@login_required
def create():
    if request.method == 'POST':
        f = request.files['file']
        name = request.form["name"]
        type = f.content_type
        files = request.form["uploaded"]
        
        if files == "0":
            error = "Please upload a mp3 file"
            return render_template("create.html", error=error)
        if name == "" or len(name) > 10:
            error = "Please fill in a name for your block between 1 and 10 caracters"
            return render_template("create.html", error=error)
        if len(name) > 6:
            name = name[0:5] + " " + name[5:]

        audio = MP3(f)
        if f.filename == "" or int(audio.info.length) > 2:
            error = "Please select a mp3 file with a maximum of 2 seconds"
            return render_template("create.html", error=error)
        ext = mimetypes.guess_extension(type, strict=True)
        path = insertSound(name, ext)
        f.save(path)
        return redirect("/dashboard")

    if request.method == "GET":
        error = ""
        return render_template("create.html", error=error)


@app.route("/dashboard", methods=["GET", "POST"])
@login_required
def dashboard():
    if request.method == "GET":
        query = "SELECT * FROM sounds WHERE user = ?"
        blocks = sql2dict(query, [1])
        userblocks = sql2dict(query, [session["user_id"]])
        return render_template("dashboard.html", blocks=blocks, userblocks=userblocks)
    if request.method == "POST":

        removeSound(request.form["button"])
        return redirect("/dashboard")


