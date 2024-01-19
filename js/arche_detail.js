jQuery(function ($) {

    "use strict";
    
  
    
    $(document).ready(function () {
        checkDetailCardEvents();
        
    });
    
    function checkDetailCardEvents() {
         $(".mdr-card-collapse-btn").click(function () {
             var dataValue = $(this).data('bs-target');
             
             var targetLink = $('a[data-bs-target="' + dataValue + '"]');

             console.log(dataValue);
             console.log(targetLink.html());
            if(targetLink.html() === '<i class="fa fa-solid fa-chevron-up"></i>') {
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
                if(data) {
                    var i = 0;
                    $.each(data, function(index, value) {
                        var html = '<div class="col-md-3 arche-home-card">';
                        html += '<div class="card">';
                        html += '<img src="https://arche-thumbnails.acdh.oeaw.ac.at/'+value.acdhid.replace('https://', '')+'?width=350" class="card-img-top" alt="'+value.title.value+'">';
                        html += '<div class="card-body">';
                        html += '<h5 class="card-title">'+value.title.value+'</h5>';
                        html += '<p class="card-text">'+value.description.value.slice(0, 200)+'...</p>';
                          html += '<a class="btn basic-arche-btn home-collections-btn" href="/browser/metadata/'+index+'">'+Drupal.t("More")+'</a>';
                        html += '</div>';
                        html += '</div>';
                        html += '</div>';
                        
                        if(i < 4) {
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