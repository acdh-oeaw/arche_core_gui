jQuery(function ($) {

    "use strict";

    var resObj = {};
    var resId = "";
    /** CTRL PRess check for the tree view  #19924 **/
    var cntrlIsPressed = false;
    const Cite = require('citation-js');
    var expertTable;
    var childTable;
    var versionVisible = false;

    $(document).ready(function () {
        addButtonToDescriptionText();
        $('#cite-loader').removeClass('hidden');
        if ($('#resourceHasVersion').val()) {
            versionVisible = true;
        }
        //$('#meta-content-container').hide();
        resId = $("#resId").val();
        checkDetailCardEvents();

        //call basic data
        //fetchMetadata();
        loadAdditionalData();

        // hide the summary div if there is no data inside it
        if ($('#av-summary').text().trim().length == 0) {
            $('#ad-summary').hide();
        }


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
        if (versionVisible) {
            fetchVersionsBlock();
        }
        fetchBreadcrumb();
        fetchRPR();
        fetchPublications();

    }

    /**
     * Truncate the text for the description field
     * @param {type} text
     * @param {type} maxLines
     * @returns {String}
     */
    function truncateText(text, wordCount) {
        return text.split(" ").splice(0, wordCount).join(" ");
    }
    function stripHtml(html) {
        var temporaryDiv = document.createElement("div");
        temporaryDiv.innerHTML = html;
        return temporaryDiv.textContent || temporaryDiv.innerText || "";
    }
    function addButtonToDescriptionText() {
        var longText = $('.descriptionTextShort').html();
        // Select the first 5 lines
        if (longText === undefined) {
            return;
        }
        var truncatedText = truncateText(longText, 150);
        var strippedLongText = stripHtml(longText).trim();
        var strippedTruncatedText = stripHtml(truncatedText).trim();

        if (strippedLongText !== strippedTruncatedText) {
            $('.descriptionTextShort').html(truncatedText + '...' + '<a class="hasdescription-toggle-button" id="descriptionTextShortBtn">' + Drupal.t("Continue reading") + '</a>');
        }
    }

    function redrawTabs() {
        console.log("redraw tab");
        // Check if there is an active tab
        if ($('#arche-detail-tabs .nav-item .nav-link.active').length === 0) {
            console.log("there is no active tab");
            // Activate the first visible tab
            var firstVisibleTab = $('#arche-detail-tabs .nav-item .nav-link:visible').first();
            firstVisibleTab.addClass('active');
            var firstVisibleTabId = firstVisibleTab.attr('href');
            $(firstVisibleTabId).addClass('show active');
        }
    }

    function hideEmptyTabs(tab) {
        $(tab).hide();
        $(tab + '-content').hide();
        redrawTabs();
    }

    /// hasDescription button ///
    $(document).delegate("#descriptionTextShortBtn", "click", function (e) {
        $('.descriptionTextShort').hide();
        $('.descriptionTextLong').show();
    });
    $(document).delegate("#descriptionTextLongBtn", "click", function (e) {
        $('.descriptionTextShort').show();
        $('.descriptionTextLong').hide();
    });

    $(document).delegate("a#copyPid", "click", function (e) {
        // Select the input field content
        var text = $('#pidValue').text();
        var tempInput = $("<input>");
        tempInput.val($('#pidValue').text());
        $("body").append(tempInput);
        tempInput.select();
        // Copy the selected text to the clipboard
        document.execCommand('copy');
        tempInput.remove();
        // Display a feedback message (optional)
        alert('Link copied to clipboard!');
        e.preventDefault();
    });


    function fetchBreadcrumb() {
        var acdhid = $('#resId').val();
        $.ajax({
            url: '/browser/api/breadcrumb/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang,
            type: "GET",
            success: function (data, status) {
                var currentUrl = window.location.href;
                var textToKeep = "/browser/metadata/";
                var position = currentUrl.indexOf(textToKeep);
                if (position !== -1) {
                    currentUrl = currentUrl.substring(0, position + textToKeep.length);
                }
                // 
                if (data) {
                    var str = "";
                    $.each(data, function (index, value) {
                        str += "<a href='" + currentUrl + value.id + "'>" + value.title + "</a>";
                        if (index !== data.length - 1) {
                            str += " \\ ";
                        }
                    });
                    $('.metadata-breadcrumb').html(str);
                }
            },
            error: function (xhr, status, error) {
                console.log("breadcrumb error" + error);
            }
        });//
    }

    function fetchVersionsBlock() {
        //get the data
        var url = $('#resId').val();
        var acdhid = $('#resId').val();
        if (url) {
            $('#versions-tree').jstree({
                'core': {
                    'data': {
                        'url': function (node) {
                            if (node.id !== "#") {
                                acdhid = node.id;
                            }
                            return '/browser/api/versions-list/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang;
                        },
                        'data': function (node) {
                            return {'id': node.id};
                        },
                        'success': function (nodes) {
                            console.log("versions success");

                            if (parseInt(nodes[0].id) !== parseInt(acdhid)) {
                                //show the newer version div
                                console.log(nodes[0].id);
                                console.log(acdhid);
                                $('#metadata-versions-alert').removeClass('hidden-alert');
                                $('#metadata-versions-alert-url').attr("href", '/browser/metadata/' + nodes[0].id);
                            }
                        }
                    },
                    themes: {stripes: true},
                    error: function (jqXHR, textStatus, errorThrown) {
                        $('#versions-tree').html("<h3>Error: </h3><p>" + jqXHR.reason + "</p>");
                    },
                    search: {
                        "ajax": {
                            "url": '/browser/api/versions-list/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang,
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
                $('#versions-tree').jstree('search', searchString);
            });

            $('#versions-tree').bind("click.jstree", function (node, data) {
                if (node.originalEvent.target.id) {
                    var node = $('#versions-tree').jstree(true).get_node(node.originalEvent.target.id);
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

                            return '/browser/api/child-tree/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang;
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
                        hideEmptyTabs('#collection-content-tab');
                    },
                    search: {
                        "ajax": {
                            "url": '/browser/api/get_collection_data_lazy/' + $('#acdhid').val() + '/' + drupalSettings.arche_core_gui.gui_lang,
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

    function removeBeforeHash(str) {
        let hashIndex = str.indexOf('#');
        if (hashIndex !== -1) {
            return str.substring(hashIndex + 1);
        } else {
            return str; // Return the original string if no # found
        }
    }


    function fetchPublications() {
        var limit = 10;
        var page = 0;
        var order = 'titledesc';
        var timeout = 10000; // in milliseconds
        var rcrTable = $('.publications-table').DataTable({
            "paging": true,
            "searching": true,
            "pageLength": 10,
            "processing": true,
            "deferRender": true,
            "bInfo": false, // Hide table information
            'language': {
                "processing": "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            "serverSide": true,
            "serverMethod": "post",
            "ajax": {
                'url': "/browser/api/publicationsDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                complete: function (response) {
                    if (response === undefined) {
                        console.log('response error');
                        console.log(error);
                        //$('.child-elements-div').hide();
                        hideEmptyTabs('#associated-publications-tab');
                        return;
                    }
                    console.log('response: ');
                    console.log(response.responseJSON);
                },
                error: function (xhr, status, error) {
                    //$(".loader-versions-div").hide();
                    console.log('error');
                    console.log(error);
                    $('.publications-elements-div').hide();
                    hideEmptyTabs('#associated-publications-tab');
                }
            },
            'columns': [
                {data: 'customCitation', render: function (data, type, row, meta) {
                        if (row.customCitation) {
                            return row.customCitation;
                        }
                        return "";
                    }
                },
                {data: 'property', render: function (data, type, row, meta) {
                        if (row.property) {
                            return removeBeforeHash(row.property);
                        }
                        return "";
                    }
                },
                {data: 'title', visible: false},
                {data: 'type', visible: false},
                {data: 'acdhid', visible: false}
            ],
            fnDrawCallback: function () {
            }
        });
    }


    function fetchRPR() {
        var limit = 10;
        var page = 0;
        var order = 'titledesc';
        var timeout = 10000; // in milliseconds
        var rcrTable = $('.rcr-table').DataTable({
            "paging": true,
            "searching": true,
            "pageLength": 10,
            "processing": true,
            "deferRender": true,
            "bInfo": false, // Hide table information
            'language': {
                "processing": "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            "serverSide": true,
            "serverMethod": "post",
            "ajax": {
                'url': "/browser/api/rprDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                complete: function (response) {
                    if (response === undefined) {
                        console.log('response error');
                        console.log(error);
                        hideEmptyTabs('#associated-coll-res-tab');
                        //$('.child-elements-div').hide();
                        return;
                    }
                    console.log('response: ');
                    console.log(response.responseJSON);
                },
                error: function (xhr, status, error) {
                    //$(".loader-versions-div").hide();
                    console.log('error');
                    console.log(error);
                    hideEmptyTabs('#associated-coll-res-tab');
                    $('.rcr-elements-div').hide();
                }
            },
            'columns': [
                {data: 'title', render: function (data, type, row, meta) {
                        return '<a href="' + row.id + '">' + row.title + '</a>';
                        var shortcut = row.type;
                        shortcut = shortcut.replace('https://vocabs.acdh.oeaw.ac.at/schema#', 'acdh:');
                        var title = removeBeforeHash(row.title);
                        var text = '<div class="col-block col-lg-12 child-table-content-div">';
                        //title
                        text += '<div class="res-property">';
                        text += '<h5 class="h5-blue-title"><a href="/browser/metadata/' + row.identifier + '">' + title + '</a></h5></div>';
                        //type
                        text += '<div class="res-property">';
                        text += '<a id="archeHref" href="/browser/search/type=' + shortcut + '&payload=false" class="btn btn-arche-gray">' + shortcut + '</a>';
                        text += '</div>';

                        //avdate

                        text += '</div>';
                        return  text;
                    }
                },
                {data: 'property', render: function (data, type, row, meta) {
                        if (row.property) {
                            return removeBeforeHash(row.property);
                        }
                        return "";
                    }
                },
                {data: 'type', render: function (data, type, row, meta) {
                        if (row.type) {
                            return removeBeforeHash(row.type);
                        }
                        return "";
                    }
                },
                {data: 'acdhid', visible: false}
            ],
            fnDrawCallback: function () {
            }
        });
    }

    function fetchChild() {
        $('#child-div-content').show();
        var limit = 10;
        var page = 0;
        var order = 'titledesc';
        var timeout = 10000; // in milliseconds

        var childTable = $('.child-table').DataTable({
            "paging": true,
            "searching": true,
            "pageLength": 10,
            "processing": true,
            "deferRender": true,
            "bInfo": false, // Hide table information
            'language': {
                "processing": "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            "serverSide": true,
            "serverMethod": "post",
            "ajax": {
                'url': "/browser/api/child/" + resId + "/en",
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
                        text += '<a id="archeHref" href="/browser/search/type=' + shortcut + '&payload=false" class="btn btn-arche-gray">' + shortcut + '</a>';
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
        console.log('INIT expert view');

        expertTable = $('#expertDT').DataTable({
            "deferRender": true,
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
        e.preventDefault();
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
            id = id.replace("/browser/metadata/", "");
            id = id.replace("/browser//metadata/", "");

            expertTable.ajax.reload();
            fetchChildTree();
            resId = id;
            //fetchMetadata();
            reloadDetail(id);
            checkDetailCardEvents();
            //loadAdditionalData();
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

        showAvailableDate();
        showType();
        //showRightSide();
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
            if (targetLink.html() === '<i class="fa fa-solid fa-chevron-up"></i>') {
                targetLink.html('<i class="fa fa-solid fa-chevron-down"></i>');
            } else {
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
            //url = "https://arche-biblatex.acdh.oeaw.ac.at/?id=https://arche-dev.acdh-dev.oeaw.ac.at/api/214536&lang=en";
            $.get(url + '&lang=' + drupalSettings.arche_core_gui.gui_lang).done(function (data) {
                $('#cite-div').removeClass('hidden');
                //$('#cite-content-div').addClass('show');
                //$('#cite-content-div').removeClass('hidden');
                $('#cite-loader').addClass('hidden');
                console.log("get done cite");
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
                    createCiteErrorResponse(error);
                    return false;
                }

            }).fail(function (xhr) {
                console.log("FAIL: ");
                console.log(xhr);
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