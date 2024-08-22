jQuery(function ($) {

    "use strict";
   
    var markersArr = [];
    var map;
    console.log("MAP JS LOADED");
   
    function initializeMap() {
        $(".map-loader").css('display', 'block');
        map = L.map('map', {
            zoomControl: false, // Add zoom control separately below
            center: [48.2, 16.3], // Initial map center
            zoom: 10, // Initial zoom level
            attributionControl: false, // Instead of default attribution, we add custom at the bottom of script
            scrollWheelZoom: false
        });

        // Add zoom in/out buttons to the top-right
        L.control.zoom({position: 'topright'}).addTo(map)

        setTimeout(function () {
            // Add baselayer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map)

            // Add geographical labels only layer on top of baselayer
            var labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
                pane: 'shadowPane'  // always display on top
            }).addTo(map)

        }, 500);
        
        setTimeout(function () {
            fetch(window.archeBaseUrl + '/browser/api/search_coordinates/' + drupalSettings.arche_core_gui.gui_lang + '?_format=json')
                    .then((response) => response.json())
                    .then((data) => {
                        var heatArr = [];

                        $.each(data, function (index, markerData) {
                            if (markerData['lon'] && markerData['lat'] && markerData['wkt']) {
                                var lon = markerData['lon'];
                                var lat = markerData['lat'];
                                var wkt = markerData['wkt'];
                                var cityName = markerData['title'];
                                
                                var marker = L.marker([lat, lon], {
                                    title: cityName, // Set the title property
                                })
                                        .bindPopup('<h5>' + cityName + '</h5><br><a href="#" id="SMMapBtn" class="btn btn-arche-blue w-100 text-light" data-coordinates="' + wkt + '" data-location-title="' + cityName + '">Add to Search</a>')
                                        .addTo(map);
                                heatArr.push([lat, lon]);
                                // Add the marker to the array
                                markersArr.push(marker);
                            }
                        });

                        var heat = L.heatLayer(data, {
                            radius: 100,
                            blur: 10
                        })

                        // Add the heatlayer to the map
                        heat.addTo(map);
                        $(".map-loader").css('display', 'none');
                    })
                    .catch((error) => {
                        console.error('Error loading JSON data: ', error);
                        $(".map-loader").css('display', 'none');
                        $(".sms-map.leaflet-container").html(error);

                        return;
                    });
        }, 2000);
    }


    // Function to destroy the map
    function destroyMap() {
        if (map) {
            map.remove();
            map = null;
        }
    }

    function filterMarkers(query) {
        query = query.toLowerCase();
        // Clear previous search results
        $("#smMapSearchResults").empty();
        // Filter markers and display matching ones
        markersArr.forEach(function (marker) {
            var markerName = marker.options.title.toLowerCase();
            if (markerName.includes(query)) {
                $('.smMapSearchResultsContainer').show();
                marker.addTo(map);
                $("#smMapSearchResults").append("<p>" + marker.options.title + "</p>");
            } else {
                map.removeLayer(marker);
            }
        });
    }
    
    /**
     * 
     * @returns {undefined}
     */
    window.displayMapSelectedValue = function() {
    //function displayMapSelectedValue() {
        window.bbox = window.guiObj.coordinates;
        if (window.guiObj.coordinates && window.guiObj.locationTitle) {
            $('#mapSelectedPlace').html('<h5 class="h5-blue-title"><button id="removeMapSelectedPlace" class="btn btn-sm-add"> - </button>' + window.guiObj.locationTitle + '</h5>');
        }
    }



    /**** EVENTS ***/

    $("#searchInput").on("input", function () {
        var query = $(this).val().toLowerCase();
        filterMarkers(query);
    });

    // Function to jump to a marker when it's clicked in the search results
    $("#smMapSearchResults").on("click", "p", function () {
        var markerTitle = $(this).text();
        $('.smMapSearchResultsContainer').hide();

        markersArr.forEach(function (marker) {
            if (marker.options.title.toLowerCase() === markerTitle.toLowerCase()) {
                var latlng = marker.getLatLng();
                map.setView(latlng, 13); // Set the view to the marker's coordinates
            }
        });
    });


    $('#resetSMSMapButton').click(function (e) {
        e.preventDefault();
        destroyMap(); // Destroy the map when hiding
        initializeMap();
    });

    $('#closeSMSMapButton').click(function () {
        var mapContainer = $('#mapContainer');
        mapContainer.hide();
        destroyMap(); // Destroy the map when hiding
    });

    $('#mapToggleBtn').click(function () {
        var mapContainer = $('#mapContainer');

        if (mapContainer.is(':visible')) {
            mapContainer.hide();
            destroyMap(); // Destroy the map when hiding
        } else {
            mapContainer.show();
            if (!map) {
                initializeMap(); // Initialize the map when showing
            }
        }
    });


});