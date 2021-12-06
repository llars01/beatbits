import sqlite3
from sqlite3.dbapi2 import Cursor
from flask import Flask, flash, redirect, render_template, request, session
from werkzeug.security import check_password_hash, generate_password_hash
import os
import mimetypes #for checking filetype
from pathlib import Path #for creating paths
from functools import wraps #for require login function
from mutagen.mp3 import MP3 #for getting length of mp3 files


app = Flask(__name__)
key = os.urandom(12)
app.secret_key = key

session = {}


def login_required(f):
    # from cs50s finance assignment
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/1.1.x/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/music")
        return f(*args, **kwargs)
    return decorated_function

# code offered by jeex to get sql returns in form of a dictionary
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

# function to instert a user into the database
def insertuser(name, hash):
    # connect to the database
    connection = sqlite3.connect('beatsbits.db')
    cursor = connection.cursor()
    query = "INSERT INTO users (username, hash) VALUES (?, ?)"
    data = (name, hash)
    # execute the query with data
    cursor.execute(query, data)
    # push the data to the database
    connection.commit()
    # close the database
    cursor.close()
    # set the userid to the current user after registering
    session["user_id"] = sql2dict("SELECT id FROM users WHERE username = ?", [name])[0]["id"]

# function to remove a sound from the database
def removeSound(name):
    # select the path of the file from the row that is going to be deleted
    query = "SELECT path FROM sounds WHERE name = ?"
    args = [name]
    path = sql2dict(query, args)[0]["path"]
    connection = sqlite3.connect('beatsbits.db')
    cursor = connection.cursor()
    # delete the found row
    query = "DELETE FROM sounds WHERE name = ?"
    cursor.execute(query, args)
    connection.commit()
    cursor.close()
    # delete the file in the previously found path if it exists
    if os.path.exists(path):
        os.remove(path)

# function to insert a uploaded sound into the database
def insertSound(name, type):
    # replace spaces with dashes for filenames
    filename = name.replace(" ", "_")
    # get the username from the current user (to use for the path)
    username = sql2dict("SELECT username FROM users WHERE id = ?", [
                        session["user_id"]])[0]["username"]
    # base path
    path = Path("static/resources/sounds") 
    filename = filename + type
    savedir = path / username
    # if this is the first file to save the directory wont exist yet so it should be created
    if not os.path.exists(savedir):
        os.mkdir(savedir)
    endpath = savedir / filename
    # instert data into the database
    connection = sqlite3.connect('beatsbits.db')
    cursor = connection.cursor()
    query = "INSERT INTO sounds (path, user, name) VALUES (?, ?, ?)"
    data = (str(endpath), session["user_id"], name)
    cursor.execute(query, data)
    connection.commit()
    cursor.close()
    # return the path where the file should be stored
    return endpath



# starting page
@app.route("/")
def index():
    return render_template("start.html")

@app.route("/mobile")
def mobile():
    return render_template("mobile.html")

# login page
@app.route("/login", methods=["GET", "POST"])
def login():
    # clear previous userdata from session
    session.clear()
    if request.method == "GET":
        return render_template("login.html")

    # by form submission
    if request.method == "POST":
        username = request.form["name"]

        # form input controle with error messaging
        if username == "" or request.form["password"] == "":
            error = "username and password did not match"
            return render_template("login.html", error=error)
        # get userdata from user with that username
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

        # set session id to userid gotten from sql
        session["user_id"] = userdata[0]["id"]
        # redirect to music page
        return redirect("/music")

# logout (not an actual page just a command to log the user out)
@app.route("/logout")
def logout():
    # clear all userdata
    session.clear()
    # return to homescreen
    return redirect("/")

# register page
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    if request.method == "POST":
        # get formdata
        username = request.form["name"] 

        # input control
        if not username or not request.form["password"] or not request.form["confirm"]:
            error = "not all fields are filled in"
            return render_template("register.html", error=error)
        if request.form["password"] != request.form["confirm"]:
            error = "passwords dont match"
            return render_template("register.html", error=error)

        # get userid and do error checking 
        query = "SELECT id FROM users WHERE username = ?"
        if len(sql2dict(query, [username])) > 0:
            error = "username is already taken"
            return render_template("register.html", error=error)
        hash = generate_password_hash(request.form["password"])
        # insert user into database
        insertuser(username, hash)
        # redirect to music page
        return redirect("/music")

# music page
@app.route("/music")
def music():
    userdata = []
    query = "SELECT * FROM sounds WHERE user = ?"
    # get all base blocks from the database
    blocks = sql2dict(query, [1]) #user_id 1 = system
    # check if user is logged in
    if session.get("user_id") is None:
        login = False
    else:
        # if so get user blocks from database too
        login = True
        userdata = sql2dict(query, [session["user_id"]])
    return render_template("other.html", blocks=blocks, userdata=userdata, login=login)

# page to create new bits
@app.route("/create", methods=["GET", "POST"])
@login_required
def create():
    if request.method == 'POST':
        # get formdata
        f = request.files['file']
        name = request.form["name"]
        type = f.content_type
        files = request.form["uploaded"]
        
        # input checks
        if files == "0":
            error = "Please upload a mp3 file"
            return render_template("create.html", error=error)
        if name == "" or len(name) > 10:
            error = "Please fill in a name for your block between 1 and 10 caracters"
            return render_template("create.html", error=error)
        if len(name) > 6:
            name = name[0:5] + " " + name[5:]

        # check filelength
        audio = MP3(f)
        if f.filename == "" or int(audio.info.length) > 2:
            error = "Please select a mp3 file with a maximum of 2 seconds"
            return render_template("create.html", error=error)
        ext = mimetypes.guess_extension(type, strict=True)
        # insert sound into database (returns path)
        path = insertSound(name, ext)
        # save the file at the given path
        f.save(path)
        # return to dashboard
        return redirect("/dashboard")

    if request.method == "GET":
        # reset error message
        error = ""
        return render_template("create.html", error=error)

# dashboard page to change all bits and sounds
@app.route("/dashboard", methods=["GET", "POST"])
@login_required
def dashboard():
    if request.method == "GET":
        # select user bits
        query = "SELECT * FROM sounds WHERE user = ?"
        blocks = sql2dict(query, ["1"])
        userblocks = sql2dict(query, [session["user_id"]])
        return render_template("dashboard.html", blocks=blocks, userblocks=userblocks)
    if request.method == "POST":
        # remove the given sound from the database and files
        removeSound(request.form["button"])
        return redirect("/dashboard")


