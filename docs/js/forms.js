$(document).ready(function() {
    // process the form
    $('#register_form').validate({
        submitHandler: function(form, event) {

            event.preventDefault();
            // get the form data
            // there are many ways to get this data using jQuery (you can use the class or id also)
            var formData = {
                'first_name' : $('input[id=user_first_name]').val(),
                'last_name' : $('input[id=user_last_name]').val(),
                'email' : $('input[id=user_email]').val(),
                'app_name' : $('input[id=user_app_name]').val(),
                'app_description' : $('#user_app_description').val() ? $('#user_app_description').val() : "",
                'website_url' : $('input[id=user_web_url]').val(),
            };
            // process the form
            $.ajax({
                type        : 'POST', // define the type of HTTP verb we want to use 
                url         : '/generateKey', // the url to submit form to 
                data        : JSON.stringify(formData), // our data object
                contentType : "application/json; charset=utf-8",
                dataType    : 'text', // what type of data do we expect back from the server
                encode      : true
            }).done(function(data) {
                // log data to the console so we can see
                $('input[id=user_first_name]').val('');
                $('input[id=user_last_name]').val('');
                $('input[id=user_email]').val('');
                $('input[id=user_app_name]').val('');
                $('textarea[id=user_app_description]').val('');
                $('input[id=user_web_url]').val('');
                alert(`An email containing the next steps has been sent to the address. Please check your inbox to activate your key. Your key will not work until it has been activated.`);
                // here we will handle errors and validation messages
            }).fail(function(error)  {
                console.log("error")
                alert("Sorry. Server unavailable.");
            }); 

        }
    });

});