var erase = false;
var grid = [];
var systemsounds = [];
var baseBlocks = [];
var sound = {};
var running = false
var data_user;
var session = {"user": 1}

// clear all bits out of the grid array
function cleargrid(){
    grid = []
    for (let i = 0; i < 20; i++) {
        grid.push(["", "", ""]);
    }
}

// create a delay for regulating bpm
// scr: https://stackoverflow.com/questions/17883692/how-to-set-time-delay-in-javascript
function delay(delayInms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
}
// play the grid of bits
async function playAll() {
    console.log(running);
    // only play if not already playing
    if(running == false){
        running = true;
        // get bpm input
        var time = $("input").val()
        // calculate needed delay from bpm
        time = (1 / time) * 60000
        // move the playing indicator line with the right speed
        moveLine(time * 20)
        // loop trough the grid per column
        for (let i = 0; i < 20; i++) {
            // play every column at once
            for (let j = 0; j < 3; j++) {
                playsound(grid[i][j])
            }
            // wait the specified amount to play the next one
            let wachten = await delay(time);
        }
        running = false;
    }
}

// function to move the indicator line
function moveLine(time) {
    // move the line from left to right on the given time
    $("#line").show().animate({
        left: "90vw",
        easing: "none"
    }, time, "linear", function () {
        // when done hide the line and put it back on the left
        $("#line").hide().css("left", "10vw")
    })
}

// creates the howls of all sounds with the howler library (similar to the one in dashboard)
function createSounds() {
    $("nav .block").each(function () {
        // base bits
        var path = String($(this).attr("data-audio"));
        var name = path.substring(0, path.lastIndexOf("/") + 1);
        name = path.replace(name, "");
        name = name.substring(0, name.indexOf("."));
        systemsounds.push({
            "name": name, "sound": new Howl({ src: path })
        })
    })
    console.log("baseblocks defined");
    // get userdata passed into main from the app.py file
    data_user = $("main").attr("data-user");
    data_user = eval(data_user)
    console.log(data_user);
    console.log(data_user.length);

    for (let i = 0; i < data_user.length; i++) {
        // user bits
        console.log(data_user[i]['path']);
        systemsounds.push({
            "name": data_user[i]["name"], "sound": new Howl({ src: data_user[i]["path"] })
        })
    }
}

// place the base set of bits into the navbar
function placeBaseBlocks() {
    var count = 0;
    $("nav .block").each(function () {
        $(this).text(baseBlocks[count]["name"]).removeClass("inactive");
        count++;
    })
}

// place the user set of bits into the navbar
function placeUserBlocks() {
    var count = 0;
    var len = data_user.length;
    $("nav .block").each(function () {
        if(count < len){
            $(this).text(data_user[count]["name"]).removeClass("inactive");
            count++;
        }
        else{
            $(this).text("").addClass("inactive");
        }
    })
}

// on key press
function action(e) {
    console.log(e.keyCode);
    // ctrl key for erase
    if (e.keyCode == 17) {
        erase = !erase
        $(".erase").toggleClass("active")
        $("table").toggleClass("cur")
    }
    // del key for delete
    if (e.keyCode == 46) {
        deleteAll
        $(".popup").hide()
    }

}

// hide pop up
function hidepopup() {
    $(".popup").hide()
    $(".delete").removeClass("active")
    $(".info").removeClass("active")
}

// delete all bits from grid
function deleteAll() {
    hidepopup();
    cleargrid();
    $("td").text("").css("background-color", "transparent")
}

$(init)
function init() {
    $(".log").click(function(){
        if ($(this).text() == "log in"){
            // take the user to login screen if logged out
            window.location.href = "/login"
        }
        else{
            // take the user to logout screen if logged in
            window.location.href = "/logout"
        }
    })
    // back button functionality
    $("#back").click(function () {
        window.location.href = "/"
    })
    // go to creation page if clicked on an empty bit
    $("nav .block").click(function () {
        if ($(this).text() == ""){
            window.location.href = "/create"
        }
    })
    // get data from bits and put it into an array
    $("nav .block").each(function (){
        var path = $(this).attr("data-audio");
        var name = $(this).text();
        baseBlocks.push({"name": name, "path": path})
    })

    createSounds()
    cleargrid();
    
    // on keypress 
    $(window).keydown(action);
    // make blocks draggable
    $(".nav > .block").draggable({
        appendTo: "td",
        containment: "body",
        revert: true,
    })
    // show modal with information on info click
    $("#info").click(function(){
        $(".popup").show()
        $(".modal > div > p").show()
        $(".modal > div > p:first-child").text("CTRL - Erase")
        $(".modal > div > p:nth-child(2)").text("DEL - Delete")
        $(".popup button").hide()
        $(".modal > p").text("Drag the bits to the grid to create your beat.")
    })
    // clicked on the nav buttons that are not the main bar with bits
    $(".sidenav").click(function(){
        // sat that bit to active
        $(this).toggleClass("active")

        // dashboard button takes you to the dashboard
        if ($(this).hasClass("dashboard")){
            window.location.href = "/dashboard"
        }

        // delete button deletes all bits in grid
        if ($(this).hasClass("delete")) {
            $(".popup").show()
            $(".modal > div > p").hide()
            $(".popup button").show()
            $(".modal > p").text("Are you sure you want to delete you beats?")
        }

        // swap button swaps between user and base bits
        if ($(this).hasClass("swap")) {
            if($(this).hasClass("active")){
                placeUserBlocks();
            }
            else{
                placeBaseBlocks();
            }
         }

        //  erase button makes your clicks erase bits
        if ($(this).hasClass("erase")) {
            erase = !erase;
            $("table").toggleClass("cur")
            console.log("setting erase to: " + erase);
        }
    })
    $(".return").click(hidepopup)
    $(".confirm").click(deleteAll)

    // make the table cells take draggable items
    $("td").droppable({
        drop: dropped,
        // show outline when hovered
        hoverClass: "hovered" 
    })

    // play sound of bit clicked
    $(".block").click(function(){
        playsound($(this).text())
    })

    // on table cell click
    $("td").click(function(){
        if (erase){
            // if erase function is active clear cell
            $(this).text("").css("background-color", "transparent");
            var x = $(this).attr("data-x")
            var y = $(this).attr("data-y")
            grid[x][y] = "";
        }
        // play sound of cell
        var name = $(this).text()
        playsound(name)
    })
    // play sounds when play button is clicked
    $(".controls img").click(playAll)
}

// play sound with selected name (same as in dashboard)
function playsound(name) {
    name = name.replace(" ", "_");
    console.log(name);
    for (let i = 0; i < systemsounds.length; i++) {
        if (systemsounds[i]["name"] == name) {
            systemsounds[i]["sound"].play();
        }

    }
}

// on dropping an element
function dropped(e, ui){
    // set the text and color of the element to the text of the element droped on it
    $(this).html(ui.draggable.text())
    var color = ui.draggable.css("color")
    $(this).css({"background-color": color})

    // get cell location
    var x = $(this).attr("data-x")
    var y = $(this).attr("data-y")
    console.log(x + " " + y);
    // store value in the grid array on that same place
    grid[x][y] = ui.draggable.text()
    console.log(grid);
}
