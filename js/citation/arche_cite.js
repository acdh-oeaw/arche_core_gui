jQuery(function ($) {
    $.noConflict();
    "use strict";
    
    
    window.Cite = require('citation-js');

    ///////////// CITE ////////////////////
    /**
     * Generate the cite tab header
     * @param string type
     * @param string first
     * @param string typeid -> id for the handle event
     * @returns string
     */
    function createCiteTab(type, typeid) {
        $('#cite-dropdown').append($('<option></option>').attr('value', typeid.toLowerCase()).text(type.toUpperCase()));
    }

    /**
     * Generate the cite block content
     * @param string data
     * @param string typeid -> id for the handle event
     * @param string first
     * @returns string
     */
    function createCiteContent(data, typeid, first) {
        var selected = 'selected';
        if (!first) {
            selected = 'hidden';
        }

        var html = "<span class='cite-content " + selected + "' id='highlight-" + typeid.toLowerCase() + "'>" + data + "</span>";
        $('#cite-content-figure').append(html);
    }

    /**
     * Show the CITE block
     * @returns {undefined}
     */
     window.showCiteBlock = function () {
        var url = $('#biblaTexUrl').val();
        console.log("showCiteBlock");
        console.log(url);
        if (url) {
            //url = "https://arche-biblatex.acdh.oeaw.ac.at/?id=https://arche-dev.acdh-dev.oeaw.ac.at/api/214536&lang=en";
            $.get(url + '&lang=' + drupalSettings.arche_core_gui.gui_lang).done(function (data) {
                $('#cite-div').removeClass('hidden');
                $('#cite-main-div').removeClass('hidden');
                $('#cite-loader').addClass('hidden');

                try {
                    let cite = new Cite(data);
                    var apa_loaded = true;
                    let templateName = 'apa-6th';
                    var template = "";
                    url_csl_content("/browser/modules/contrib/arche_core_gui/csl/apa-6th-edition.csl")
                            .done(function (data) {

                                template = data;
                                Cite.CSL.register.addTemplate(templateName, template);
                                var opt = {
                                    format: 'string'
                                };
                                opt.type = 'html';
                                opt.style = 'citation-' + templateName;
                                opt.lang = 'en-US';
                                createCiteTab('apa 6th', 'apa-6th');
                                createCiteContent(cite.get(opt), 'apa-6th', true);
                                apa_loaded = false;
                            }).then(function (d) {

                        //harvard
                        var opt = {
                            format: 'string'
                        };
                        opt.type = 'html';
                        opt.style = 'citation-harvard1';
                        opt.lang = 'en-US';
                        createCiteTab('harvard', 'harvard');
                        createCiteContent(cite.get(opt), 'harvard', apa_loaded);
                        //Vancouver
                        var opt = {
                            format: 'string'
                        };
                        opt.type = 'html';
                        opt.style = 'citation-vancouver';
                        opt.lang = 'en-US';
                        createCiteTab('vancouver', 'vancouver');
                        createCiteContent(cite.get(opt), 'vancouver', false);
                        createCiteTab('BiblaTex', 'biblatex');
                        createCiteContent(data, 'BiblaTex', false);
                    });
                } catch (error) {
                    console.log("CITE ERROR");
                    $('#cite-loader').addClass('hidden');
                    createCiteErrorResponse(error);
                    return false;
                }

            }).fail(function (xhr) {
                console.log("CITE FAIL");
                $('#cite-loader').addClass('d-none');
                createCiteErrorResponse(Drupal.t("CITE is not available!"));
                return false;
            });
        }
    }

    /**
     * Display Cite error message
     * @param {type} errorText
     * @returns {undefined}
     */
    function createCiteErrorResponse(errorText) {
        $('#cite-div').removeClass('hidden');
        $('#cite-loader').addClass('hidden');
        //stop spinner
        $('#cite-div').html('<div class="alert alert-danger" role="alert">' + Drupal.t(errorText) + '</>');
    }
    window.url_csl_content = function (url) {
        return $.get(url);
    }

    /**
     * Handle the cite content changes on select
     * @param {type} selectedOption
     * @returns {undefined}
     */
    function handleCiteSelectEvents(selectedOption) {
        $('#cite-content-figure span').removeClass('selected').addClass('hidden');
        $('#highlight-' + selectedOption).addClass('selected').removeClass('hidden');
    }

    $('#cite-dropdown').on('change', function (e) {
        e.preventDefault();
        var selectedOption = $(this).val(); // Get the selected option value
        handleCiteSelectEvents(selectedOption);
    });

    $(document).delegate("a#copyCite", "click", function (e) {
        var $tempTextarea = $('<textarea>');
        // Set the textarea value to the content of the div
        $tempTextarea.val($('.cite-content.selected .csl-entry').text());
        // Append the textarea to the body
        $('body').append($tempTextarea);
        // Select the textarea content
        $tempTextarea.select();
        // Copy the selected content to the clipboard
        document.execCommand('copy');
        // Remove the temporary textarea
        $tempTextarea.remove();
        $('#copy-cite-btn-confirmation').show();
        setTimeout(function () {
            $('#copy-cite-btn-confirmation').hide();
        }, 5000);
        e.preventDefault();
    });



});