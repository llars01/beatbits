systemsounds = []
selection = ""

function createSounds() {
    $(".block").each(function () {
        if ($(this).attr("data-audio") != "") {
            var path = String($(this).attr("data-audio"));
            var name = path.substring(0, path.lastIndexOf("/") + 1);
            name = path.replace(name, "");
            name = name.substring(0, name.indexOf("."));
            systemsounds.push({
                "name": name, "sound": new Howl({ src: path })
            })
            console.log("pushing: { name: " + name + " , sound: howl" );
        }
        else{
            console.log("skipped: " + this);
        }
    })
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
createSounds()
$(".block").click(function(){
    if( $(this).hasClass("inactive")){
        window.location.href = "/create"
    }
    playsound($(this).text())
})

$("#back").click(function () {
    window.location.href = "/other"
})

$(".confirm").click(function(){
    $("form input").val(selection)
    $("form").submit()
})
$(".block").dblclick(function(){
    $(".popup").show()
    if($(this).parents().hasClass("base")){
        alert("you cant delete base set bits!")
        $(".modal > p").text("Base bits can't be deleted")
        $(".popup button").hide()
    }
    else{
        $(".popup button").show()
        $(".modal > p").text("Are you sure you want to delete this bit?")

        selection = $(this).text()
    }
})
$(".return").click(function(){
    $(".popup").hide();
})




