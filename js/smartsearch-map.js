jQuery(function ($) {

    "use strict";

    window.initializeMaps = function () {
        window.map = L.map('map').setView([48.2, 16.3], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(window.map);

        // FeatureGroup is to store editable layers
        window.searchArea = new L.FeatureGroup();
        window.map.addLayer(window.searchArea);

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
                remove: false,
                edit: false,
                featureGroup: window.searchArea
            }
        });
        window.map.addControl(drawControl);

        // Custom map close button
        var customCloseControl = L.Control.extend({
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
                L.DomEvent.on(container, 'click', function() {window.mapToggle();});

                return container;
            }
        });
        window.map.addControl(new customCloseControl());

        // Custom search area delete button
        var customDeleteControl = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

                container.style.backgroundColor = 'white';
                container.style.width = '30px';
                container.style.height = '30px';
                container.style.lineHeight = '30px';
                container.style.textAlign = 'center';
                container.style.cursor = 'pointer';
                container.title = 'Delete All Layers';

                container.innerHTML = '<img class="smartsearch_trash_icon" src="/browser/modules/contrib/arche_core_gui/images/trash_icon.png"/>'; // Trash icon (can be replaced with an image or text)

                container.onclick = function () {
                    window.mapRemoveSearchArea();
                };

                // Prevent click propagation to the map
                L.DomEvent.disableClickPropagation(container);

                return container;
            }
        });
        window.map.addControl(new customDeleteControl());

        // search area draw events
        window.map.on(L.Draw.Event.DRAWSTART, function (event) {
            window.searchArea.clearLayers();
        });
        window.map.on(L.Draw.Event.CREATED, function (event) {
            window.searchArea.addLayer(event.layer);
            window.mapRefreshLabel();
        });
    }

    window.mapToggle = function(show) {
        if (show === undefined) {
            show = $('.sm-map').css('top') != '0px';
        }
        $('.sm-map').css('top', show ? 0 : -3000);
        $('.sm-map').css('position', show ? 'inherit' : 'absolute');
        window.setTimeout(function () {window.map.invalidateSize();}, 100);
    }

    window.mapRemoveSearchArea = function() {
        window.searchArea.clearLayers();
        window.mapRefreshLabel();
    }

    window.mapRefreshLabel = function () {
        var coord = window.searchArea.getBounds();
        var label = '';
        if (coord._northEast) {
            label = '<div class="mapLabelDiv"><a href="#" id="mapRemoveFiltersBtn"><img src="/browser/modules/contrib/arche_core_gui/images/trash_icon.png" class="smartsearch_trash_icon"></a> ' + coord.getWest().toPrecision(3) + ', ' + coord.getSouth().toPrecision(3) + ' - ' + coord.getEast().toPrecision(3) + ', ' + coord.getNorth().toPrecision(3) + '</div>';
        }
        $('#mapLabel').html(label);
    }
});
