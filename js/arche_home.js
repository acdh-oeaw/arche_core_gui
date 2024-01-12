jQuery(function ($) {

    "use strict";
    
    fetchTopcollections();
    $(document).ready(function () {
        console.log('HOME');
    });
    
    
    function fetchTopcollections() {
        $.ajax({
            url: '/browser/api/topcollections/8/en',
            type: "GET",
            success: function (data, status) {
                console.log(data);
                
                if(data) {
                    var i = 0;
                    $.each(data, function(index, value) {
                        var html = '<div class="col-md-3">';
                        html += '<div class="card">';
                        html += '<img src="https://arche-thumbnails.acdh.oeaw.ac.at/'+value.acdhid.replace('https://', '')+'?width=350" class="card-img-top" alt="'+value.title.value+'">';
                        html += '<div class="card-body">';
                        html += '<h5 class="card-title">'+value.title.value+'</h5>';
                        html += '<p class="card-text">'+value.description.value.slice(0, 200)+'...</p>';
                        html += '</div>';
                        html += '<a class="btn btn-primary absolute-bottom-btn " href="/browser/metadata/'+index+'">Mehr Info</a>';
                        html += '</div>';
                        html += '</div>';
                        
                        
                        if(i < 4) {
                            console.log('activeban: '+i);
                            $('#home-carousel-first-page').append(html);
                        } else {
                            console.log('NEM activeban: '+i);
                            $('#home-carousel-second-page').append(html);
                        }
                        
                        i++;
                        console.log(i);
                        
                        
                    });
                    
                }
                
                /*
                var html = '<div class="col-md-3">
                                <div class="card">
                                    <img src="https://dummyimage.com/600x350/adb5bd/495057" class="card-img-top" alt="1...">
                                    <div class="card-body">
                                        <h5 class="card-title">Card title 1</h5>
                                        <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                                    </div>
                                    <a class="btn btn-primary absolute-bottom-btn" href="#">Mehr Info</a>
                                </div>
                            </div>';
                 * 
                 */
                $('#detail-overview-api-div').html(data);
              
            },
            error: function (xhr, status, error) {
                
                console.log('error overview');
                console.log(error);
                
            }
        });
    }

});