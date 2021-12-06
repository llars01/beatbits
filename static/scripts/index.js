
// submit form when clicked on submit button
$("a[type='submit']").click(function(){
    $("form").submit()
})

// back button functionality
$("#back").click(function () {
    window.location.href = "/"
})
// hide back button on home page
if ($("form").length){
    $("#back").show()
} 
else{
    $("#back").hide()
}