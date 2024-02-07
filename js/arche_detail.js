jQuery(function ($) {

    "use strict";

    var resObj = {};
    var resId = "";
    /** CTRL PRess check for the tree view  #19924 **/
    var cntrlIsPressed = false;
    const Cite = require('citation-js');


    $(document).ready(function () {
        //$('#meta-content-container').hide();
        resId = $("#resId").val();
        console.log(resId);
        checkDetailCardEvents();

        //call basic data
        //fetchMetadata();
        loadAdditionalData();


    });

    $(document).keydown(function (event) {
        if (event.which == "17")
            cntrlIsPressed = true;
    });

    $(document).keyup(function () {
        cntrlIsPressed = false;
    });
    /** CTRL PRess check for the tree view   #19924  END **/



    function loadAdditionalData() {
        initExpertView();
        fetchChildTree();
        //fetchChild();
        showCiteBlock();
    }

    $(document).delegate("a#copyPid", "click", function (e) {
        // Select the input field content
        $('#pidValue').attr('href');

        // Copy the selected text to the clipboard
        document.execCommand('copy');

        // Deselect the input field
        $('#pidValue').blur();

        // Display a feedback message (optional)
        alert('Link copied to clipboard!');
        e.preventDefault();
    });


    function fetchChildTree() {

        //get the data
        var url = $('#resId').val();

        if (url) {

            $('#child-tree').jstree({
                'core': {
                    'data': {
                        'url': function (node) {
                            var acdhid = $('#resId').val();

                            if (node.id != "#") {
                                acdhid = node.id;
                            }

                            return '/browser/api/child-tree/' + acdhid + '/' + drupalSettings.language;
                        },
                        'data': function (node) {
                            return {'id': node.id};
                        },
                        'success': function (nodes) {
                        }
                    },
                    themes: {stripes: true},
                    error: function (jqXHR, textStatus, errorThrown) {
                        $('#child-tree').html("<h3>Error: </h3><p>" + jqXHR.reason + "</p>");
                    },
                    search: {
                        "ajax": {
                            "url": '/browser/api/get_collection_data_lazy/' + $('#acdhid').val() + '/' + drupalSettings.language,
                            "data": function (str) {
                                return {
                                    "operation": "search",
                                    "q": str
                                };
                            }
                        },
                        case_sensitive: false
                    },
                    plugins: ['search']
                }
            });
            // not ready yet
            $("#search-input").keyup(function () {
                var searchString = $(this).val();
                $('#child-tree').jstree('search', searchString);
            });

            $('#child-tree').bind("click.jstree", function (node, data) {
                if (node.originalEvent.target.id) {
                    var node = $('#child-tree').jstree(true).get_node(node.originalEvent.target.id);
                    if (node.original.uri) {
                        if (cntrlIsPressed)
                        {
                            window.open("/browser/metadata/" + node.original.uri, '_blank');
                        } else {
                            window.location.href = "/browser/metadata/" + node.original.uri;
                        }
                    }
                }
            });

        }



    }

    function fetchChild() {
        $('#child-div-content').show();
        var limit = 10;
        var page = 0;
        var order = 'titledesc';
        var timeout = 10000; // in milliseconds
        console.log("chil url: ");
        console.log("/browser/api/child/" + resId + "/en/" + limit + '/' + page + '/' + order);
        var childTable = $('.child-table').DataTable({
            "paging": true,
            "searching": true,
            "pageLength": 10,
            "processing": true,
            "bInfo": false, // Hide table information
            'language': {
                "processing": "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            "serverSide": true,
            "serverMethod": "post",
            "ajax": {
                'url': "/browser/api/child/" + resId + "/en",
                //'url': "https://arche-dev.acdh-dev.oeaw.ac.at/browser/api/child/214536/en",
                complete: function (response) {
                    if (response === undefined) {
                        console.log('response error');
                        console.log(error);
                        $('.child-elements-div').hide();
                        return;
                    }
                    console.log('response: ');
                    console.log(response.responseJSON);
                },
                error: function (xhr, status, error) {
                    //$(".loader-versions-div").hide();
                    console.log('error');
                    console.log(error);
                    $('.child-elements-div').hide();
                }
            },
            'columns': [
                {data: 'title', render: function (data, type, row, meta) {
                        var shortcut = row.type;
                        shortcut = shortcut.replace('https://vocabs.acdh.oeaw.ac.at/schema#', 'acdh:');
                        var text = '<div class="col-block col-lg-12 child-table-content-div">';
                        //title
                        text += '<div class="res-property">';
                        text += '<h5 class="h5-blue-title"><a href="/browser/metadata/' + row.identifier + '">' + row.title + '</a></h5></div>';
                        //type
                        text += '<div class="res-property">';
                        text += '<a id="archeHref" href="/browser/search/type=' + shortcut + '&payload=false" class="btn btn-arche-grey">' + shortcut + '</a>';
                        text += '</div>';

                        //avdate

                        text += '</div>';
                        return  text;
                    }


                },
                {data: 'image', width: "20%", render: function (data, type, row, meta) {
                        var acdhid = row.acdhid.replace('https://', '');
                        acdhid = row.acdhid.replace('http://', '');
                        return '<div class="dt-single-res-thumb text-center" style="min-width: 120px;">\n\
                            <center><a href="https://arche-thumbnails.acdh.oeaw.ac.at/' + acdhid + '?width=600" data-lightbox="detail-titleimage-' + row.id + '">\n\
                                <img class="img-fluid bg-white" src="https://arche-thumbnails.acdh.oeaw.ac.at/' + acdhid + '?width=75">\n\
                            </a></center>\n\
                            </div>';
                    }
                },
                {data: 'property', visible: false},
                {data: 'type', visible: false},
                {data: 'avDate', visible: false},
                {data: 'shortcut', visible: false},
                {data: 'acdhid', visible: false},
                {data: 'sumcount', visible: false}
            ],
            fnDrawCallback: function () {
                $(".child-table thead").remove();
            }
        });
        /*
         $("#sortBy").change(function () {
         var colIdx = $('#sortBy :selected').val();
         let id = colIdx.substring(0, 1);
         let order = colIdx.substring(2, 3);
         orderVal = 'asc';
         if (order > 0) {
         orderVal = 'desc';
         }
         
         childTable.order([id, orderVal]).draw();
         });*/
    }

    function initExpertView() {
        $('#expertDT').DataTable({
            //"dom": '<"top"lfp<"clear">>rt<"bottom"i<"clear">>',

        });
    }

    function reloadDetail(id) {
        $.ajax({
            url: '/browser/metadata_ajax/' + id,
            type: "GET",
            success: function (data, status) {
                $('#meta-content-container').show();
                $('#block-arche-theme-content').html(data);
                var currentUrl = window.location.href;
                var textToKeep = "/browser/metadata/";
                var position = currentUrl.indexOf(textToKeep);
                if (position !== -1) {
                    currentUrl = currentUrl.substring(0, position + textToKeep.length);
                }
                window.history.replaceState({}, '', currentUrl + id);
            },
            error: function (xhr, status, error) {
                $('#block-arche-theme-content').html(error);
            }
        });//
    }


    //expertDtDiv

    $(document).delegate("#expertViewBtn", "click", function (e) {
        console.log('clicked expert');
        if ($(this).hasClass('basic')) {
            $('#meta-content-container').hide();
            $('#expertdt-container').fadeIn(200);
            $(this).removeClass('basic');
            $(this).addClass('expert');
            $(this).text(Drupal.t('Basic-View'));

        } else {
            $('#expertdt-container').hide();
            $('#meta-content-container').fadeIn(200);
            $(this).removeClass('expert');
            $(this).addClass('basic');
            $(this).text(Drupal.t('Expert-View'));
        }

    });

    $(document).delegate("a#archeHref", "click", function (e) {
        $('#meta-content-container').hide();
        var url = $(this).attr('href');
        if (url && url.indexOf("/browser/metadata/") >= 0 || url && url.indexOf("/browser//metadata/") >= 0) {
            $('html, body').animate({scrollTop: '0px'}, 0);

            var id = url;
            console.log(id);
            id = id.replace("/browser/metadata/", "");
            id = id.replace("/browser//metadata/", "");

            console.log(id);
            resId = id;
            //fetchMetadata();
            reloadDetail(id);
            e.preventDefault();
        } else {
            e.preventDefault();
            window.open(url, '_blank');
            $(".loader-div").hide();
        }
    });

    //hsndle the internal urls to reload the page



    //update the UI elements

    function showUI() {
        console.log("Update UI:");
        console.log(resObj);
        console.log("avdate: ");
        showAvailableDate();
        console.log("type: ");
        showType();
        //showRightSide();
        console.log("title: ");
        showTitle();
        //showCite();
        //showSummary();
        //showChildView();
        //showRPR();
        //showExpertView();
        //showInverseTable();
        //showBreadcrumb();


        $('#meta-content-container').show();
        $('#meta-right-container').show();
        $('.metadata-main-loader').hide();
        $('.metadata-right-loader').hide();

    }

    function showRightSide() {
        //showTitleImage();
        //showPid();
        //showMap();
        //showLicenses();
        //showSource();
        //showDownload();
        //showViewAndShare();
        //showVersions();

    }

    function showType() {
        if (resObj.getType()) {
            $('#av-rdfType').html(resObj.getType());
        } else {
            $('#ad-rdfType').hide();
        }
    }

    function showTitle() {
        if (resObj.getTitle()) {
            $('#av-hasTitle').html(resObj.getTitle());
        } else {
            $('#ad-hasTitle').hide();
        }
    }

    function showAvailableDate() {
        console.log("showAvailableDate");
        console.log(resObj.getAvailableDate());
        if (resObj.getAvailableDate()) {
            var text = $('#av-hasAvailableDate').text();
            $('#av-hasAvailableDate').html(text + resObj.getAvailableDate());
        } else {
            $('#ad-hasAvailableDate').hide();
        }
    }

    function fetchMetadata() {

        $.ajax({
            url: '/browser/api/expert/' + resId + '/en',
            type: "GET",
            success: function (data, status) {
                console.log("van data");
                console.log(data);
                console.log("Res obj: ");
                try {
                    resObj = new $.fn.MetadataClass(data);

                    showUI();
                } catch (error) {
                    // Code to handle the exception
                    console.error("An error occurred:", error.message);
                    $('#meta-content-container').show().html('Error during the data fetch! Please report it!');
                    $('#meta-right-container').hide();
                    $('.metadata-main-loader').hide();
                    $('.metadata-right-loader').hide();
                }
            },
            error: function (xhr, status, error) {
                $('#meta-content-container').show().html('Error during the data fetch! Please report it!');
                $('#meta-right-container').hide();
                $('.metadata-main-loader').hide();
                $('.metadata-right-loader').hide();
            }
        });
    }


    function checkDetailCardEvents() {
        $(".mdr-card-collapse-btn").click(function () {
            var dataValue = $(this).data('bs-target');

            var targetLink = $('a[data-bs-target="' + dataValue + '"]');

            console.log(dataValue);
            console.log(targetLink.html());
            if (targetLink.html() === '<i class="fa fa-solid fa-chevron-up"></i>') {
                console.log("now up change to down");
                targetLink.html('<i class="fa fa-solid fa-chevron-down"></i>');
            } else {
                console.log("now change to up");
                targetLink.html('<i class="fa fa-solid fa-chevron-up"></i>');
            }
        });
    }

    function fetchTopcollections() {
        $.ajax({
            url: '/browser/api/topcollections/8/en',
            type: "GET",
            success: function (data, status) {
                if (data) {
                    var i = 0;
                    $.each(data, function (index, value) {
                        var html = '<div class="col-md-3 arche-home-card">';
                        html += '<div class="card">';
                        html += '<img src="https://arche-thumbnails.acdh.oeaw.ac.at/' + value.acdhid.replace('https://', '') + '?width=350" class="card-img-top" alt="' + value.title.value + '">';
                        html += '<div class="card-body">';
                        html += '<h5 class="card-title">' + value.title.value + '</h5>';
                        html += '<p class="card-text">' + value.description.value.slice(0, 200) + '...</p>';
                        html += '<a class="btn basic-arche-btn home-collections-btn" href="/browser/metadata/' + index + '">' + Drupal.t("More") + '</a>';
                        html += '</div>';
                        html += '</div>';
                        html += '</div>';

                        if (i < 4) {
                            $('#home-carousel-first-page').append(html);
                        } else {
                            $('#home-carousel-second-page').append(html);
                        }
                        i++;
                    });
                }
                $('#home-collections-slider-loader').fadeOut('slow');
                $('#detail-overview-api-div').html(data);
            },
            error: function (xhr, status, error) {
                $('#home-collections-slider-loader').fadeOut('slow');
                $('#detail-overview-api-div').html(error);
            }
        });
    }

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
    function showCiteBlock() {

        var url = $('#biblaTexUrl').val();
        if (url) {
            url = "https://arche-biblatex.acdh.oeaw.ac.at/?id=https://arche-dev.acdh-dev.oeaw.ac.at/api/214536&lang=en";
            $.get(url).done(function (data) {
                $('#cite-content-div').addClass('show');
                $('#cite-content-div').removeClass('hidden');
                $('#cite-loader').addClass('hidden');

                try {
                    let cite = new Cite(data);

                    var apa_loaded = true;

                    let templateName = 'apa-6th';
                    var template = "";
                    url_csl_content("/browser/modules/contrib/arche_core_gui/csl/apa-6th-edition.csl").done(function (data) {

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
                    createCiteErrorResponse(error);
                    return false;
                }

            }).fail(function (data) {
                createCiteErrorResponse("The Resource does not have CITE data.");
            });
        }
    }

    /**
     * Display Cite error message
     * @param {type} errorText
     * @returns {undefined}
     */
    function createCiteErrorResponse(errorText) {
        $('#cite-content-div').addClass('show');
        $('#cite-content-div').removeClass('hidden');
        $('#cite-loader').addClass('hidden');
        $('#cite-selector-div').hide();
        $('#cite-content-figure').hide();
        $('.bd-clipboard').hide();
        //stop spinner
        $('#cite-content-div').append('<div class="messages messages--warning">' + Drupal.t(errorText) + '</>');
    }

    function url_csl_content(url) {
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
        $tempTextarea.val($('.csl-entry').text());
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