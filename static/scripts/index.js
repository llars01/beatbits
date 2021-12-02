$("a[type='submit']").click(function(){
    $("form").submit()
})
$("#back").click(function () {
    window.location.href = "/"
})
if ($("form").length){
    $("#back").show()
} 
else{
    $("#back").hide()
}