jQuery(function ($) {

    "use strict";

    var markersArr = [];
    window.map;
    
    window.initializeMaps = function (reinit = false) {
        map = L.map('map').setView([48.2, 16.3], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // FeatureGroup is to store editable layers
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Initialize the draw control and pass it the FeatureGroup of editable layers
        var drawControl = new L.Control.Draw({
            draw: {
                position: 'topleft',
                rectangle: {
                    shapeOptions: {
                        color: '#97009c'
                    }
                },
                polygon: false,
                polyline: false,
                circle: false,
                marker: false,
                circlemarker: false
            },
            edit: {
                edit: false,
                featureGroup: drawnItems
            }
        });
        map.addControl(drawControl);

        if (!reinit) {
            var coordinates = (window.guiObj.facets !== undefined && window.guiObj.facets.map !== undefined) ? window.guiObj.facets.map : "";
            if (coordinates) {
                var coordinatesString = coordinates.replace('POLYGON((', '').replace('))', '');
                var coordinatesArray = coordinatesString.split(',');

                // Reformat the coordinates to [latitude, longitude] for Leaflet
                var polygonCoordinates = coordinatesArray.map(function (coord) {
                    var latLng = coord.trim().split(' ');
                    return [parseFloat(latLng[1]), parseFloat(latLng[0])];
                });

                var latitudes = polygonCoordinates.map(function (coord) {
                    return coord[0];
                });
                var longitudes = polygonCoordinates.map(function (coord) {
                    return coord[1];
                });

                var southWest = [Math.min.apply(null, latitudes), Math.min.apply(null, longitudes)];
                var northEast = [Math.max.apply(null, latitudes), Math.max.apply(null, longitudes)];

                var bounds = [southWest, northEast];

                // Create a rectangle layer
                var rectangle = L.rectangle(bounds, {
                    fillColor: '#97009c'
                });

                //map.addLayer(drawnItems);
                drawnItems.addLayer(rectangle);
                drawnItems.addTo(map);

                setTimeout(function () {
                    window.setMapLabel(drawnItems);
                }, 1000);

                map.fitBounds(rectangle.getBounds());
            }
        }

        map.on(L.Draw.Event.CREATED, function (event) {
            drawnItems.clearLayers();
            window.bboxObj = {};
            var layer = event.layer;
            map.removeLayer(layer);
            drawnItems.addLayer(layer);

            window.bboxObj = {drawnItems};
            window.setMapLabel(drawnItems);
        });

        map.on('draw:drawstart', function (event) {
            var layer = event.layer;
            if (layer) {
                map.removeLayer(layer);
                drawnItems.clearLayers();
            }
        });

        map.on('draw:deleted', function (event) {
            var layer = event.layer;
            map.removeLayer(layer);
            $('#mapLabel').html('');
            $('.sm-map').css('top', '-1000px');
            $('.sm-map').css('display', 'block');
        });

        window.bbox = drawnItems;

        var customControl = L.Control.extend({
            options: {
                position: 'topright' // Position the button in the top right corner
            },
            onAdd: function (map) {
                var container = L.DomUtil.create('button', 'leaflet-bar');
                container.innerHTML = 'Close'; // Text of the button
                container.style.backgroundColor = 'white';
                container.style.width = '60px';
                container.style.height = '30px';
                container.style.fontWeight = 'bold';
                container.style.cursor = 'pointer';
                container.style.border = 'none';
                container.style.outline = 'none';

                // Prevent the map from handling the click
                L.DomEvent.disableClickPropagation(container);

                // Setup the click event on the button
                L.DomEvent.on(container, 'click', function () {
                    $('.sm-map').css('top', $('.sm-map').css('top') == '0px' ? -2000 : 0);
                    $('.sm-map').css('position', $('.sm-map').css('position') == 'absolute' ? 'inherit' : 'absolute');

                    setTimeout(function () {
                        map.invalidateSize();  // 'map' is your Leaflet map variable
                    }, 100);
                });

                return container;
            }
        });

        // Add the new control to the map
        map.addControl(new customControl());
    }


    window.initializeMap = function () {
        //function initializeMap() {
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
    window.displayMapSelectedValue = function () {
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
        window.initializeMaps();
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
                window.initializeMaps(); // Initialize the map when showing
            }
        }
    });

    window.setMapLabel = function (bbox) {
    //function setMapLabel(bbox) {
        var coord = bbox.getLayers()[0].toGeoJSON().geometry.coordinates[0];
        $('#mapLabel').html('<div class="mapLabelDiv"><a href="#" id="mapRemoveFiltersBtn">X</a> ' + coord[0][0].toPrecision(3) + ', ' + coord[0][1].toPrecision(3) + ' - ' + coord[2][0].toPrecision(3) + ', ' + coord[2][1].toPrecision(3) + '</div>');
    }

});