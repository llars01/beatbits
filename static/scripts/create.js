// style the upload button differntly when a file is uploaded
$("#file-upload").change(function(){
    if ($("#file-upload").val() != null){
        $("form label").addClass("uploaded")
        $("#uploaded").val("1")
        $(".uploaded > p").text("uploaded")
    }
})
// back function takes you to the previous screen
$("#back").click(function () {
    window.location.href = "/dashboard"
})