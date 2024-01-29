jQuery(function ($) {

    "use strict";

    var resObj = {};
    var resId = "";

    $(document).ready(function () {
        //$('#meta-content-container').hide();
        resId = $("#resId").val();
        console.log(resId);
        checkDetailCardEvents();

        //call basic data
        //fetchMetadata();



    });
    
    
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
    
    
    function reloadDetail(id) {
        $.ajax({
            url: '/browser/metadata_ajax/'+id,
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
                window.history.replaceState({}, '', currentUrl+id);
            },
            error: function (xhr, status, error) {
                $('#block-arche-theme-content').html(error);
            }
        });//
    }

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
});