jQuery(function ($) {

    "use strict";

    $(document).ready(function () {
        //fetchRoot();
    });
    
    $(document).delegate("#getClarinVCR", "click", function (e) {
        e.preventDefault();
        $('#vcr-div > form').submit();
    });


});