jQuery(function ($) {
    $.noConflict();
    "use strict";
    var resObj = {};
    var resId = "";
    /** CTRL PRess check for the tree view  #19924 **/
    var cntrlIsPressed = false;
    var versionVisible = false;
    var smartSearchInputField = $('#sm-hero-str');
    var autocompleteTimeout = null;
    var autocompleteCounter = 1;
    var currentUrl = $(location).attr('href');
    var apiUrl = currentUrl.replace('/browser/metadata/', '/api/');
    var baseApiUrl = drupalSettings.arche_core_gui.baseApiUrl;
    var acdhType = $('#resource-type').val();


    $(document).ready(function () {
        resId = $("#resId").val();
        addButtonToDescriptionText();
        checkCartButton();
        $('#cite-loader').removeClass('hidden');
        if ($('#resourceHasVersion').val()) {
            versionVisible = true;
        }

        checkDetailCardEvents();
        loadAdditionalData(resId);
        // hide the summary div if there is no data inside it
        if ($('#av-summary').text().trim().length == 0) {
            $('#ad-summary').hide();
        }
        if (acdhType == 'resource' || acdhType == 'metadata') {
            checkUserPermission();
        } else {
            $('.download-login-div').addClass('d-none');
            $('#download-restricted').addClass('d-none');
            $('#download-not-logged').addClass('d-none');
            $('#download-logged').addClass('d-none');
            $('#download-not-authorized').addClass('d-none');
            $('#download-resource-section').removeClass('d-none');
        }

        generateGoogleDataset();
    });

    /**
     * #26347 Google Dataset
     * @returns {undefined}
     */
    function generateGoogleDataset() {

        var apiUrl = drupalSettings.arche_core_gui.apiUrl;
        if (apiUrl.indexOf("arche.acdh.oeaw.ac.at") !== -1) {
            if (acdhType === "topcollection") {
                
                var pid = $('#pidValue').text();
                if (pid && pid.trim() !== '') {
                    var encodedPid = encodeURIComponent(pid);
                    console.log('https://arche.acdh.oeaw.ac.at/oaipmh/?verb=GetRecordRaw&metadataPrefix=schema.org&format=application%2Fld%2Bjson&identifier=' + encodedPid);
                    $.ajax({
                        url: 'https://arche.acdh.oeaw.ac.at/oaipmh/?verb=GetRecordRaw&metadataPrefix=schema.org&format=application%2Fld%2Bjson&identifier=' + encodedPid,
                        method: 'GET',
                        dataType: 'text',
                        success: function (structuredDataText) {                            
                            var script = document.createElement('script');
                            script.type = 'application/ld+json';
                            script.textContent = structuredDataText;
                            document.head.appendChild(script);
                            console.log("Google OAIPMH success");
                        },
                        error: function (xhr, status, error) {
                            console.error('Google OAIPHM AJAX error:', error);
                        }
                    });
                }
            }
        }
    }

    $(document).keydown(function (event) {
        if (event.which == "17")
            cntrlIsPressed = true;
    });

    $(document).keyup(function () {
        cntrlIsPressed = false;
    });
    /** CTRL PRess check for the tree view   #19924  END **/

    //httpd logout
    $(document).delegate(".httpd-logout-btn", "click", function (e) {
        $.ajax({
            url: "/api/user/logout",
            type: "GET",
            timeout: 10000,
            headers: {
                "Authorization": "Basic " + btoa("invalid:credentials")
            },
            error: function () {
                if (currentUrl.endsWith("#")) {
                    currentUrl = currentUrl.slice(0, -1);
                }
                alert("You have been logged out.");
                setTimeout(function () {
                    window.location.href = currentUrl;
                }, 2000); // 2-second delay

            }
        });
    });

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


    //expertDtDiv
    $(document).delegate("#expertViewBtn", "click", function (e) {
        e.preventDefault();
        if ($(this).hasClass('basic')) {
            $('#meta-content-container').hide();
            $('#expertdt-container').fadeIn(200);
            $(this).removeClass('basic');
            $(this).addClass('expert');
            $(this).text(Drupal.t('Basic view'));
        } else {
            $('#expertdt-container').hide();
            $('#meta-content-container').fadeIn(200);
            $(this).removeClass('expert');
            $(this).addClass('basic');
            $(this).text(Drupal.t('Expert view'));
        }
    });

    $(document).delegate("#remove-resource-cart", "click", function (e) {
        e.preventDefault();
        window.removeCartItem(resId);
        $('#remove-resource-cart').addClass('d-none');
        $('#add-resource-cart').removeClass('d-none');
    });


    function checkCartButton() {
        console.log("checkCartButton");
        const rawCart = window.getCookieByName('cart_items');
        const cart = rawCart ? JSON.parse(rawCart) : {};
        jQuery.each(cart, function (index, item) {
            if (resId === index) {
                $('#remove-resource-cart').removeClass('d-none');
                $('#add-resource-cart').addClass('d-none');
            }
        });
    }


    /*
     $(document).delegate("a#archeHref", "click", function (e) {
     $('#meta-content-container').html();
     var url = $(this).attr('href');
     if (url && url.indexOf("/browser/metadata/") >= 0 || url && url.indexOf("/browser//metadata/") >= 0) {
     $('html, body').animate({scrollTop: '0px'}, 0);
     var id = url;
     id = id.replace("/browser/metadata/", "");
     id = id.replace("/browser//metadata/", "");
     reloadMainDetailView(id);
     e.preventDefault();
     } else {
     e.preventDefault();
     window.open(url, '_blank');
     $(".loader-div").hide();
     }
     });
     */

    /**
     * After user login, check if the user is allowed to download the actual resource
     * @returns {undefined}
     */
    function checkUserPermission() {
        if ($('div').hasClass('download-login-div')) {
            let resourceId = $("#resId").val();
            let aclRead = $("#resource-acl-read").val();

            let resourceAccess = $('#resource-access').val();
            //if the resource or collection is public then we hide the login
            //and display all download possbility
            if (resourceAccess.includes("public")) {

                $('#download-resource-section').removeClass('d-none');
                $('#download-not-logged').addClass('d-none');

            } else {
                $('#download-not-logged').removeClass('d-none');
                var accessLevel = 'public';
                if (resourceAccess) {
                    accessLevel = resourceAccess;
                } else if (aclRead) {
                    accessLevel = aclRead;
                }
                //if not then we have to check the actual logged user permissions
                $.ajax({
                    url: '/browser/api/checkUser/' + resourceId + '/' + accessLevel,
                    method: 'GET',
                    timeout: 10000,
                    success: function (data) {
                        if (data.length === 0 || data.access == 'login') {
                            $('#download-not-logged').removeClass('d-none');
                        } else {
                            if (data.access == 'authorized' || (acdhType.toLowerCase() === 'collection' || acdhType.toLowerCase() === 'topcollection')) {
                                $('#download-restricted').addClass('d-none');
                                $('#download-not-logged').addClass('d-none');
                                $('#download-logged').removeClass('d-none');
                                $('#download-not-authorized').addClass('d-none');
                                $('#download-resource-section').removeClass('d-none');
                                $('#user-logged-text').html(data.username + ' : ' + data.roles);
                            } else if (data.access == 'not authorized') {
                                $('#download-restricted').addClass('d-none');
                                $('#download-not-logged').addClass('d-none');
                                $('#download-logged').addClass('d-none');
                                $('#download-not-authorized').removeClass('d-none');
                                $('#user-logged-not-auth-text').html(data.username + ' : ' + data.roles);
                            } else if (data.access == 'login') {
                                $('#download-not-logged').removeClass('d-none');
                            }
                        }
                    },
                    error: function (xhr, status, error) {
                        console.log('checkUserPermission error :' + error);
                    }
                });
            }
        }
    }

    function loadAdditionalData(reloadID) {
        let acdhType = $('#resource-type').val().toLowerCase();

        if (acdhType === 'collection' || acdhType === 'topcollection' || acdhType === 'resource' || acdhType === 'oldresource' || acdhType === 'metadata') {
            fetchChildTree(reloadID);

            if ($.fn.dataTable.isDataTable('#rcrDT')) {
                window.rprTable.ajax.url("/browser/api/rprDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchRPR(reloadID);
            }

            if ($.fn.dataTable.isDataTable('#publicationsDT')) {
                window.publicationsTable.ajax.url("/browser/api/publicationsDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchPublications(reloadID);
            }



        }
        //ok
        if (acdhType === 'place') {
            window.fetchPlaceSpatialTable(reloadID);
            if ($.fn.dataTable.isDataTable('#isPartOfDT')) {
                window.isPartOfTable.ajax.url("/browser/api/isPartOfDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchIsPartOf(reloadID);
            }
        }
        //ok
        if (acdhType === 'person') {
            if ($.fn.dataTable.isDataTable('#contributedDT')) {
                window.contributedTable.ajax.url("/browser/api/contributedDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchPersonContributedTable(reloadID);
            }
        }
        //need to check the table and need to write the ispartof values
        if (acdhType === 'publication') {
            /*
             if ($.fn.dataTable.isDataTable('#publicationInverseDT')) {
             window.relatedTable.ajax.url("/browser/api/publicationInverseDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
             } else {
             window.fetchPublicationsRelatedResourcesTable(reloadID);
             }
             */
            if ($.fn.dataTable.isDataTable('#isPartOfDT')) {
                window.isPartOfTable.ajax.url("/browser/api/isPartOfDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchIsPartOf(reloadID);
            }
        }

        // ok
        if (acdhType === 'organisation') {
            if ($.fn.dataTable.isDataTable('#involvedDT')) {
                window.involvedTable.ajax.url("/browser/api/involvedDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchOrganisationInvolvedTable(reloadID);
            }

            if ($.fn.dataTable.isDataTable('#hasMembersDT')) {
                window.hasMemberTable.ajax.url("/browser/api/hasMembersDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchOrganisationHasMembersTable(reloadID);
            }

        }

        // ok
        if (acdhType === 'concept') {
            if ($.fn.dataTable.isDataTable('#spatialDT')) {
                window.spatialTable.ajax.url("/browser/api/spatialDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchPlaceSpatialTable(reloadID);
            }
        }

        //waiting for instructions
        if (acdhType === 'project') {
            if ($.fn.dataTable.isDataTable('#projectAssociatedDT')) {
                window.projectAssociatedlTable.ajax.url("/browser/api/projectAssociatedDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchProjectAssociatedTable(reloadID);
            }
        }

        // needs to be developed the Collection Content 
        if (acdhType === 'conceptscheme') {
            if ($.fn.dataTable.isDataTable('#collectionConceptDT')) {
                window.collectionConceptTable.ajax.url("/browser/api/collectionConceptDT/" + reloadID + "/" + drupalSettings.arche_core_gui.gui_lang, ).load();
            } else {
                window.fetchCollectionConceptTable(reloadID);
            }
        }

        if (versionVisible) {
            fetchVersionsBlock();
        }

        fetchNextPrevItem();
        //beacuse of the ajax reload we have to wait
        setTimeout(function () {
            showTitleImage();
            fetchBreadcrumb();
            window.showCiteBlock();
            window.initExpertView();
            redrawTabs();
        }, 2000);
    }



    /**
     * Fetch the previos or next child elements with ajax
     * @returns {undefined}
     */
    function fetchNextPrevItem() {
        var acdhid = $('#resId').val();
        var rootId = $('#rootId').val();

        if (rootId) {
            $.ajax({
                url: '/browser/api/nextPrevItem/' + rootId + '/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang,
                type: "GET",
                timeout: 20000,
                success: function (data, status) {
                    if (data) {
                        if (data.next) {
                            $('#next-child-url').html('<a href="/browser/metadata/' + data.next.id + '"  alt="' + data.next.title + '" title="' + data.next.title + '">' + Drupal.t('Next') + ' >>> </a>');
                            $('#next-child-url-iiif-btn').html('<a href="/browser/metadata/' + data.next.id + '" class=""  alt="' + data.next.title + '" title="' + data.next.title + '">' + Drupal.t('Next') + ' >>></a>');
                        }
                        if (data.previous) {
                            $('#previous-child-url').html('<a href="/browser/metadata/' + data.previous.id + '"  alt="' + data.previous.title + '" title="' + data.previous.title + '"> <<< ' + Drupal.t('Previous') + ' </a>');
                            $('#previous-child-url-iiif-btn').html('<a href="/browser/metadata/' + data.previous.id + '" class="" alt="' + data.previous.title + '" title="' + data.previous.title + '"><<< ' + Drupal.t('Previous') + '</a>');
                        }

                    }
                },
                error: function (xhr, status, error) {
                    console.log("next prev item fetch error" + error);
                }
            });
        }
    }

    /**
     * Display and fetch the resource breadcrumb data
     * @returns {undefined}
     */
    function fetchBreadcrumb() {
        var acdhid = $('#resId').val();
        $.ajax({
            url: '/browser/api/breadcrumb/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang,
            type: "GET",
            timeout: 40000,
            success: function (data, status) {
                //var currentUrl = window.location.href;
                var textToKeep = "/browser/metadata/";
                var breadcrumbUrl = "";
                var position = currentUrl.indexOf(textToKeep);
                if (position !== -1) {
                    breadcrumbUrl = currentUrl.substring(0, position + textToKeep.length);
                }
                // 
                if (data) {
                    var str = "";
                    $.each(data, function (index, value) {
                        str += "<a href='" + breadcrumbUrl + value.id + "' title='" + value.placeholder + "'>" + value.title + "</a>";
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
        }); //
    }

    /**
     * Fetch and display the resource versions
     * @returns {undefined}
     */
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
                            if (parseInt(nodes[0].id) !== parseInt(acdhid)) {
                                //show the newer version div
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

    /**
     * Fetch and display the childtree
     * @returns {undefined}
     */
    function fetchChildTree(reloadID = "") {
        //get the data
        var acdhid = $('#resId').val();
        if (reloadID) {
            acdhid = reloadID;
        }
        if ($('#child-tree').jstree(true)) {
            $('#child-tree').jstree('destroy');
        }
        if (acdhid) {
            $('#child-tree').jstree({
                'core': {
                    'data': {
                        'url': function (node) {
                            if (node.id != "#") {
                                acdhid = node.id;
                            }
                            return '/browser/api/child-tree/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang;
                        },
                        'data': function (node) {
                            return {'id': node.id};
                        },
                        'success': function (nodes) {
                            if (nodes.length === 0) {
                                $('#collection-content-tab').addClass('d-none');
                                $('#collection-content-tab a.nav-link').removeClass('active');
                                $('#collection-content-tab-content').addClass('d-none');
                                $('#collection-content-tab-content').removeClass('active');
                                //window.hideEmptyTabs();
                                //redrawTabs();
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('AJAX error:', error);
                        }
                    },
                    themes: {stripes: true},
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("error");
                        console.log(jqXHR);
                        console.log(textStatus);
                        console.log(errorThrown);
                        //$('#child-tree').html("<h3>Error: </h3><p>" + jqXHR.reason + "</p>");
                        $('#collection-content-tab').addClass('hidden');
                        $('#collection-content-tab').removeClass('active');
                        $('#collection-content-tab-content').addClass('hidden');
                        $('#collection-content-tab-content').removeClass('active');
                        // window.hideEmptyTabs();
                    }
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


    /**
     * Display the titleimage with ajax if we a response 
     * @returns {undefined}
     */
    function showTitleImage() {
        var isPublic = $('#resource-access').val();
        var imgSrc = 'https://arche-thumbnails.acdh.oeaw.ac.at?id=' + apiUrl + '&width=600';
        $.ajax({
            url: imgSrc,
            type: 'GET',
            timeout: 5000,
            success: function (data) {
                $('.titleimage-loader').hide();
                $('.card.metadata.titleimage').show().html('<center><a href="https://arche-thumbnails.acdh.oeaw.ac.at?id=' + apiUrl + '&width=600" data-lightbox="detail-titleimage">\n\
                                        <img class="img-fluid" src="https://arche-thumbnails.acdh.oeaw.ac.at?id=' + apiUrl + '&width=200" >\n\
                                        </a></center>');
            },
            error: function () {
                console.log("showTitleImage error");
                $('.titleimage-loader').hide();
                $('.card.metadata.titleimage').addClass('d-none');
                //console.log('Failed to fetch image.');
                return;
            }
        });
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

    window.redrawTabs = function () {
        var isActive = false;
        if ($('.jstree-children').find('li').length === 0) {
            $('#collection-content-tab').addClass('d-none');
            $('#collection-content-tab-content').addClass('d-none');
        } else {
            isActive = true;
        }
        if ($(".publications-table tbody").find("tr").length === 0) {
            $('#associated-publications-tab').addClass('d-none');
            $('#associated-publications-tab-content').addClass('d-none');
        } else {
            if (isActive === false) {
                $('#associated-publications-tab a.nav-link').addClass('active');
                $('#associated-publications-tab-content').addClass('active');
                $('#associated-publications-tab-content').removeClass('fade');
                isActive = true;
            }
        }
        if ($(".rcr-table tbody").find("tr").length === 0) {
            $('#associated-coll-res-tab').addClass('d-none');
            $('#associated-coll-res-tab-content').addClass('d-none');
        } else {
            if (isActive === false) {
                $('#associated-coll-res-tab a.nav-link').addClass('active');
                $('#associated-coll-res-tab-content').addClass('active');
                $('#associated-coll-res-tab-content').removeClass('fade');
                isActive = true;
            }
        }

    }

    window.hideEmptyTabs = function () {
        var tabs = ['#collection-content-tab', '#associated-publications-tab', '#associated-coll-res-tab'];
        var notHiddenTab = "";
        tabs.forEach(function (tabId, index) {
            if (!$(tabId).hasClass('hidden') && notHiddenTab === "") {
                $(tabId + ' a.nav-link').show();
                $(tabId + ' a.nav-link').addClass('active');
                $(tabId + '-content').show();
                $(tabId + '-content').addClass('active');
                $(tabId + '-content').removeClass('fade');
            }
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
                var reloadUrl = "";
                if (position !== -1) {
                    reloadUrl = currentUrl.substring(0, position + textToKeep.length);
                }
                window.history.replaceState({}, '', reloadUrl + id);
            },
            error: function (xhr, status, error) {
                $('#block-arche-theme-content').html(error);
            }
        });
    }

    function reloadMainDetailView(id) {
        //fetchChildTree();
        reloadDetail(id);
        checkDetailCardEvents();
        loadAdditionalData(id);
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


    /***
     * SMART SEARCH START
     */

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
                            var responseObject = $.parseJSON(data);
                            // Initialize autocomplete with the retrieved results
                            smartSearchInputField.autocomplete({source: []});
                            smartSearchInputField.autocomplete({
                                source: responseObject
                            });
                            // Open the autocomplete dropdown
                            smartSearchInputField.autocomplete('search');
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
