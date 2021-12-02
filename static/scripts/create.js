$("#file-upload").change(function(){
    if ($("#file-upload").val() != null){
        $("form label").addClass("uploaded")
        $("#uploaded").val("1")
        $(".uploaded > p").text("uploaded")
    }
})
$("#back").click(function () {
    window.location.href = "/dashboard"
})