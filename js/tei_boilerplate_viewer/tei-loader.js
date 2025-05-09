
(function ($) {
    'use strict';
    //const url = "https://arche.acdh.oeaw.ac.at/api/1820794"; 
    //const url = "https://arche.acdh.oeaw.ac.at/api/208298";
    var url = $('#resApiId').val();
    $(document).ready(function () {
        $.ajax({
            url: url,
            method: "GET",
            dataType: "xml",
            success: function (xml) {
                // Convert XML to string
                const xmlString = new XMLSerializer().serializeToString(xml.documentElement);
                const formatted = formatXml(xmlString);
                $("#tei-container").show();
                $('#tei-content').html('<pre>' + formatted + '</pre>');
            },
            error: function (xhr, status, error) {
                $("#tei-container").hide();
                console.log("Failed to load TEI document.");
                //$("#tei-content").text("Failed to load TEI document.");
                //console.error("Error fetching XML:", status, error);
            }
        });
    });

    function formatXml(xml) {
        const PADDING = '  '; // 2 spaces
        let formatted = '';
        let pad = 0;
        const reg = /(>)(<)(\/*)/g;
        xml = xml.replace(reg, '$1\r\n$2$3');
        $.each(xml.split('\r\n'), function (index, node) {
            let indent = 0;
            if (node.match(/^<\/\w/)) {
                pad = Math.max(pad - 1, 0); // safe decrease
            }
            formatted += PADDING.repeat(pad) + node + '\r\n';
            if (node.match(/^<\w([^>]*[^\/])?>.*$/)) {
                pad++;
            }
        });
        return formatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

})(jQuery);
