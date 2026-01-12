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
    function createCiteContent(data, typeid, first, json = false) {
        var selected = 'selected';
        if (!first) {
            selected = 'hidden';
        }
        var prewrap = "white-space: unset;";
        if (json) {
            prewrap = "white-space: pre-wrap;"
        }
        var html = "<span class='cite-content " + selected + "' style='" + prewrap + "' id='highlight-" + typeid.toLowerCase() + "'>" + data + "</span>";
        $('#cite-content-figure').append(html);

    }

    function displayHarvard(cite, apa_loaded) {
        var opt = {
            format: 'string'
        };
        opt.type = 'html';
        opt.style = 'citation-harvard1';
        opt.lang = 'en-US';
        createCiteTab('harvard', 'harvard');
        createCiteContent(cite.get(opt), 'harvard', apa_loaded);
    }

    function displayVancouver(cite, apa_loaded) {
        var opt = {
            format: 'string'
        };
        opt.type = 'html';
        opt.template = 'vancouver';
        opt.style = 'citation-vancouver';
        opt.lang = 'en-US';
        createCiteTab('vancouver', 'vancouver');
        createCiteContent(cite.get(opt), 'vancouver', false);
    }

    function displayJsonCsl(data) {
        const formattedJson = JSON.stringify(data, null, 2);
        createCiteTab('json-csl', 'json-csl');
        createCiteContent(formattedJson, 'json-csl', false, true);
    }

    function displayBiblatex(url) {
        $.get(url).done(function (data) {
            createCiteTab('BiblaTex', 'biblatex');
            createCiteContent(data, 'BiblaTex', false, true);
        }).fail(function (xhr) {
            console.log("Biblatex fetch is not possible!");
            return;
        });

    }

    function displayArchetCite(url) {
        $.get(url).done(function (data) {
            const formattedJson = JSON.stringify(data, null, 2);
            createCiteTab('Arche Citation', 'arche-citation');
            createCiteContent(formattedJson, 'arche-citation', false, true);
        }).fail(function (xhr) {
            console.log("Arche Citation fetch is not possible!");
            return;
        });
    }

    /**
     * Show the CITE block
     * @returns {undefined}
     */
    window.showCiteBlock = function () {
        var url = $('#biblaTexUrl').val();

        if (url) {
            //url = "https://arche-biblatex.acdh.oeaw.ac.at/?id=https://arche.acdh.oeaw.ac.at/api/1819726&lang=en&format=application%2Fvnd.citationstyles.csl%2Bjson";
            //console.log(url);
            //$.get(url).done(function (data) {
            $.get(url + '&lang=' + drupalSettings.arche_core_gui.gui_lang + '&format=application%2Fvnd.citationstyles.csl%2Bjson').done(function (data) {
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
                                createCiteContent(cite.get(opt), 'apa-6th', false, true);
                                apa_loaded = false;
                            }).then(function (d) {



                        let archeTestCslName = 'arche-test';

                        return url_csl_content("/browser/modules/contrib/arche_core_gui/csl/ARCHE_citation-style.csl")
                                .done(function (archeTestCsl) {

                                    Cite.CSL.register.addTemplate(archeTestCslName, archeTestCsl);

                                    let archeTestOpt = {
                                        format: 'string',
                                        type: 'html',
                                        style: 'citation-Arche-test',
                                        lang: 'en-US'
                                    };

                                    createCiteTab('arche-test', 'arche-test');
                                    createCiteContent(cite.get(archeTestOpt), 'arche-test', true);
                                    apa_loaded = false;
                                });

                    }).then(function (d) {

                        if (window.location.href.includes("https://arche-curation.acdh-dev.oeaw.ac.at/browser/")) {
                            displayArchetCite(url + '&lang=' + drupalSettings.arche_core_gui.gui_lang + '&format=arche-citation-style');
                        }

                        //harvard
                        displayHarvard(cite, apa_loaded);

                        //Vancouver
                        displayVancouver(cite, apa_loaded);

                        // url + '&lang=' + drupalSettings.arche_core_gui.gui_lang + '&format=application%2Fvnd.citationstyles.csl%2Bjson'
                        displayBiblatex(url + '&lang=' + drupalSettings.arche_core_gui.gui_lang + '&format=application%2Fx-bibtex');
                        //displayBiblatex("https://arche-biblatex.acdh.oeaw.ac.at/?id=https://arche.acdh.oeaw.ac.at/api/1819726&lang=en&format=application%2Fx-bibtex");
                        displayJsonCsl(data);
                    });
                } catch (error) {
                    console.log("CITE ERROR");
                    $('#cite-loader').addClass('hidden');
                    createCiteErrorResponse(error);
                    return false;
                }

            }).fail(function (xhr) {
                console.log("CITE FAIL : " + url + '&lang=' + drupalSettings.arche_core_gui.gui_lang + '&format=application%2Fvnd.citationstyles.csl%2Bjson');
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
        var contentText = "";
        if (!$('.cite-content.selected .csl-entry').length || !$('.cite-content.selected .csl-entry').text().trim()) {
            contentText = $('.cite-content.selected').text();
        } else {
            contentText = $('.cite-content.selected .csl-entry').text();
        }
        $tempTextarea.val(contentText);
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
