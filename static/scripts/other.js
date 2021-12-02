var erase = false;
var grid = [];
var systemsounds = [];
var baseBlocks = [];
var sound = {};
var running = false
var data_user;
var session = {"user": 1}

function cleargrid(){
    grid = []
    for (let i = 0; i < 20; i++) {
        grid.push(["", "", ""]);
    }
}
function delay(delayInms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
}
async function playAll() {
    console.log(running);
    if(running == false){
        running = true;
        console.log("running set: " + running);
        var time = $("input").val()
        time = (1 / time) * 60000
        moveLine(time * 20)
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 3; j++) {
                console.log("1");
                playsound(grid[i][j])
            }
            let wachten = await delay(time);
        }
        console.log("end function");
        running = false;
    }
}
function moveLine(time) {
    $("#line").show().animate({
        left: "90vw",
        easing: "none"
    }, time, "linear", function () {
        $("#line").hide().css("left", "10vw")
        
    })
}

function createSounds() {
    $("nav .block").each(function () {
        var path = String($(this).attr("data-audio"));
        var name = path.substring(0, path.lastIndexOf("/") + 1);
        name = path.replace(name, "");
        name = name.substring(0, name.indexOf("."));
        systemsounds.push({
            "name": name, "sound": new Howl({ src: path })
        })
    })
    console.log("baseblocks defined");
    data_user = $("main").attr("data-user");
    data_user = eval(data_user)
    console.log(data_user);
    console.log(data_user.length);

    for (let i = 0; i < data_user.length; i++) {
        console.log(data_user[i]['path']);
        systemsounds.push({
            "name": data_user[i]["name"], "sound": new Howl({ src: data_user[i]["path"] })
        })
    }
}

function placeBaseBlocks() {
    var count = 0;
    $("nav .block").each(function () {
        $(this).text(baseBlocks[count]["name"]).removeClass("inactive");
        count++;
    })
}

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



$(init)
function action(e){
    console.log(e.keyCode);
    // ctrl key for erase
    if (e.keyCode == 17){ 
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
function hidepopup(){
    $(".popup").hide()
    $(".delete").removeClass("active")
    $(".info").removeClass("active")
}
function deleteAll() {
    hidepopup();
    cleargrid();
    $("td").text("").css("background-color", "transparent")
}
function init() {
    $(".log").click(function(){
        if ($(this).text() == "log in"){
            window.location.href = "/login"
        }
        else{
            window.location.href = "/logout"
        }
    })
    $("#back").click(function () {
        window.location.href = "/"
    })
    $("nav .block").click(function () {
        if ($(this).text() == ""){
            window.location.href = "/create"
        }
    })
    $("nav .block").each(function (){
        var path = $(this).attr("data-audio");
        var name = $(this).text();
        baseBlocks.push({"name": name, "path": path})
    })
    console.log(baseBlocks);
    createSounds()
    cleargrid();
    $(window).keydown(action);
    $(".nav > .block").draggable({
        appendTo: "td",
        containment: "body",
        revert: true,
    })
    $("#info").click(function(){
        $(".popup").show()
        $(".modal > div > p").show()
        $(".modal > div > p:first-child").text("CTRL - Erase")
        $(".modal > div > p:nth-child(2)").text("DEL - Delete")
        $(".popup button").hide()
        $(".modal > p").text("Drag the bits to the grid to create your beat.")
    })

    $(".sidenav").click(function(){
        $(this).toggleClass("active")
        if ($(this).hasClass("dashboard")){
            window.location.href = "/dashboard"
        }
        if ($(this).hasClass("delete")) {
            $(".popup").show()
            $(".modal > div > p").hide()
            $(".popup button").show()
            $(".modal > p").text("Are you sure you want to delete you beats?")
        }
        if ($(this).hasClass("swap")) {
            if($(this).hasClass("active")){
                placeUserBlocks();
            }
            else{
                placeBaseBlocks();
            }
         }
        if ($(this).hasClass("erase")) {
            erase = !erase;
            $("table").toggleClass("cur")
            console.log("setting erase to: " + erase);
        }
    })
    $(".return").click(hidepopup)
    $(".confirm").click(deleteAll)
    $("td").droppable({
        drop: dropped,
        hoverClass: "hovered" 
    })
    $(".block").click(function(){
        playsound($(this).text())
    } )
    $("td").click(function(){
        if (erase){
            $(this).text("").css("background-color", "transparent");
            var x = $(this).attr("data-x")
            var y = $(this).attr("data-y")
            grid[x][y] = "";
        }
        var name = $(this).text()
        playsound(name)
    })
    $(".controls img").click(playAll)
    $(".controls img").dblclick(function () {
        if($(".swap").hasClass("active")){
            window.location.href = "/create" 
        }
    })
}
function myHelper(event) {
    return "<div class='block helper'>"+ $(this).text()+ "<div>";
}
function playsound(name) {
    name = name.replace(" ", "_");
    console.log(name);
    for (let i = 0; i < systemsounds.length; i++) {
        if (systemsounds[i]["name"] == name) {
            systemsounds[i]["sound"].play();
        }

    }
}

function dropped(e, ui){
    // alert("drop")
    // alert(this)
    $(this).html(ui.draggable.text())
    var color = ui.draggable.css("color")
    $(this).css({"background-color": color})
    var x = $(this).attr("data-x")
    var y = $(this).attr("data-y")
    console.log(x + " " + y);
    grid[x][y] = ui.draggable.text()
    console.log(grid);
}
