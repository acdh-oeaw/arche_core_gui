jQuery(function ($) {


    $("#getClarinVCR").click(function (event) {
        event.preventDefault();
        $('#getClarinVCR').hide();
        $('#vcr-data-loading').show();
        setInterval(blink_text('vcr-data-loading'), 10000);
       
        var searchStr = $('#sm-hero-str').val();
        var pagerPage = (window.getGuiSearchParams('actualPage') ?? 1) - 1;
        //var guiFacets_ = (getGuiSearchParams('facets')) ? getGuiSearchParams('facets') : {};

        if (searchStr === "") {
            searchStr = (window.getGuiSearchParams('q')) ? window.getGuiSearchParams('q') : "";
        }

        var param = window.buildParams(searchStr, pagerPage, '/browser/api/vcr/');
        param.success = function (x) {
            buildAndSubmitVcrForm($('#search-clarinurl').val(), x);
            $('#vcr-data-loading').hide();
            $('#vcr-search-result-text').append('VCR Data Submitted');
            setTimeout(
                    function () {
                        //$('#dynamicVcr').submit(function (e) {
                         //   e.preventDefault();
                        //});
                        $('#vcr-search-result-text').hide();
                        $('#getClarinVCR').show();
                    },
                    4000);
        };

        param.fail = function (xhr, textStatus, errorThrown) {
            $('#vcr-search-result-text').append(Drupal.t('VCR Data Submit Failed'));
        };

        param.error = function (xhr, status, error) {
            $('#vcr-search-result-text').append(Drupal.t('VCR Data Submit Failed') + error);
        };
        param.timeout = 60000;
        $.ajax(param);
    });

    function blink_text(text_id) {
        $('#' + text_id).fadeOut(500);
        $('#' + text_id).fadeIn(500);
    }

    function buildAndSubmitVcrForm(clarinUrl, data) {
        $('<form action="' + clarinUrl + '" method="POST" target="_blank" id="dynamicVcr" class="dynamicVcrForm">\n\
        <input type="hidden" name="name" value="ArcheCollection"/>\n\</form>').appendTo('#vcr-search-form');
        let obj = JSON.parse(data);
        $.each(obj, function (key, value) {
            var dataObj = {};
            dataObj.uri = value.uri;
            dataObj.title = value.title;
            dataObj.description = value.description;
            $('<input type="hidden" name="resourceUri"/>').val(JSON.stringify(dataObj)).appendTo('#dynamicVcr');
        });
        setTimeout(function () {
            $('#dynamicVcr').submit();
        }, 200);
    }
});

