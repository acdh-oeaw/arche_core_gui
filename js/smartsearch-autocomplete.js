jQuery(function ($) {
   smartSearchInputField = $('#sm-hero-str');
    autocompleteTimeout = null;
    autocompleteCounter = 1;
    
    
    smartSearchInputField.autocomplete({
        minLength: 2, // Minimum number of characters to trigger autocomplete
        autoFocus: false,
        delay: 300,
        open: function () {
            $("ul.ui-menu").width($(this).innerWidth());
        }
    });

    // Attach keyup event listener to the input field
    smartSearchInputField.on('keyup', function () {
        if (event.keyCode !== 37 && // Left arrow
                event.keyCode !== 38 && // Up arrow
                event.keyCode !== 39 && // Right arrow
                event.keyCode !== 40    // Down arrow
                ) {
            // Get the current value of the input field
            var inputValue = $(this).val();

            // Check if the input value is at least 2 characters long
            if (inputValue.length >= 2) {
                if (autocompleteTimeout) {
                    // invalidate the previous autocomplete search
                    clearTimeout(autocompleteTimeout);
                }
                // make the AJAX query only if no further keyup events in next 0.3s
                autocompleteTimeout = setTimeout(() => {
                    autocompleteCounter++;
                    var localCounter = autocompleteCounter;
                    // Make an AJAX request to your API
                    $.ajax({
                        url: '/browser/api/smsearch/autocomplete/' + inputValue,
                        method: 'GET',
                        success: function (data) {
                            // show this results only if no further searches were made in the meantime
                            if (localCounter === autocompleteCounter) {
                                var responseObject = $.parseJSON(data);
                                // Initialize autocomplete with the retrieved results
                                smartSearchInputField.autocomplete({source: []});
                                smartSearchInputField.autocomplete({
                                    source: responseObject
                                });
                                // Open the autocomplete dropdown
                                smartSearchInputField.autocomplete('search');
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('Error fetching autocomplete data:', error);
                        }
                    });
                }, 300);
            }
        }
    });
});
