systemsounds = []
selection = ""

// creates the howls of all sounds with the howler library
function createSounds() {
    $(".block").each(function () {
        // gets the audio data from every block
        if ($(this).attr("data-audio") != "") {
            // gets that file
            var path = String($(this).attr("data-audio"));
            var name = path.substring(0, path.lastIndexOf("/") + 1);
            name = path.replace(name, "");
            name = name.substring(0, name.indexOf("."));
            systemsounds.push({
                // makes it into a sound
                "name": name, "sound": new Howl({ src: path })
            })
            console.log("pushing: { name: " + name + " , sound: howl" );
        }
        else{
            console.log("skipped: " + this);
        }
    })
}

// play the sound with name X
function playsound(name) {
    name = name.replace(" ", "_");
    console.log(name);
    // go trough all sounds and play the one with the matching name
    for (let i = 0; i < systemsounds.length; i++) {
        if (systemsounds[i]["name"] == name) {
            systemsounds[i]["sound"].play();
        }
    }
}


createSounds();
$(".block").click(function(){
    if( $(this).hasClass("inactive")){
        // get taken to the create page when you click an inactive block
        window.location.href = "/create"
    }
    // otherwise play its sound
    playsound($(this).text())
})

// back button functionality
$("#back").click(function () {
    window.location.href = "/music"
})

// confirm on modal submits the form
$(".confirm").click(function(){
    // delete the selected block
    $("form input").val(selection)
    $("form").submit()
})

// double click a block to delete it
$(".block").dblclick(function(){
    // show modal
    $(".popup").show()

    if($(this).parents().hasClass("base")){
        // show basebits cant be deleted
        $(".modal > p").text("Base bits can't be deleted")
        // hide confirmation button
        $(".popup button").hide()
    }
    else{
        // show confirmation button
        $(".popup button").show()
        // ask if user is sure to delete their bit
        $(".modal > p").text("Are you sure you want to delete this bit?")
        // select the clicked bit
        selection = $(this).text()
    }
})

// hide modal when clicked on
$(".return").click(function(){
    $(".popup").hide();
})




