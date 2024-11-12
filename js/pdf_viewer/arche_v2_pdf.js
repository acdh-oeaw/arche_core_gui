jQuery(function ($) {

    "use strict";


    $(document).ready(function () {
        var currentUrl = $(location).attr('href');
        var url = currentUrl.replace('/browser/metadata/', '/api/');
        var pdfContainer = $('#pdf-container');
        var thumbnailContainer = $('#thumbnail-container');
        var toolbar = $('#pdf-toolbar');
        let pdfDoc = null;
        let currentPage = 1;
        let scale = 1;
        let baseScale = 1;  // Initial fit-to-container scale
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

        // Load PDF document
        pdfjsLib.getDocument(url).promise.then(function (pdf) {
            pdfDoc = pdf;
            $('#page-count').text(pdf.numPages);
            renderPage(currentPage);
            renderThumbnails();
        }).catch((error) => {
            $('#pdf-viewer-container').addClass('d-none');
            $('#pdf-toolbar').addClass('d-none');
            console.log('Error loading PDF:', error);
        });
// Function to render a page in the main viewer
        function renderPage(pageNumber) {
            pdfDoc.getPage(pageNumber).then(function (page) {
                // Get the dimensions of the pdf-container
                const containerWidth = pdfContainer.width();
                const containerHeight = pdfContainer.height();

                // Calculate base scale only if it hasn’t been set (for initial fit)
                if (baseScale === 1) {
                    const viewport = page.getViewport({scale: 1});
                    const scaleX = containerWidth / viewport.width;
                    const scaleY = containerHeight / viewport.height;
                    baseScale = Math.min(scaleX, scaleY); // Set the initial fit-to-container scale
                }

                // Calculate the actual scale by multiplying baseScale with zoom scale
                const viewport = page.getViewport({scale: baseScale * scale});

                // Create and resize the canvas to fit the container
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Clear and append the canvas to the container
                pdfContainer.empty().append(canvas);

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                page.render(renderContext);
                $('#page-num').text(pageNumber);
            });
        }

        // Function to render thumbnails
        function renderThumbnails() {
            thumbnailContainer.empty();
            for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
                pdfDoc.getPage(pageNumber).then(function (page) {
                    const viewport = page.getViewport({scale: 0.3}); // Smaller scale for thumbnails
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    page.render({
                        canvasContext: context,
                        viewport: viewport
                    });

                    // Set click handler to jump to page
                    $(canvas).css('margin-bottom', '10px').click(function () {
                        currentPage = pageNumber;
                        renderPage(currentPage);
                    });

                    thumbnailContainer.append(canvas);
                });
            }
        }

        // Toolbar controls
        $('#prev-page').click(function () {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
            }
        });

        $('#next-page').click(function () {
            if (currentPage < pdfDoc.numPages) {
                currentPage++;
                renderPage(currentPage);
            }
        });

        $('#zoom-in').click(function () {
            scale += 0.25;
            renderPage(currentPage);
        });

        $('#zoom-out').click(function () {
            if (scale > 0.5) {
                scale -= 0.25;
                renderPage(currentPage);
            }
        });

        // Enable dragging for zoomed content
        pdfContainer.on('mousedown', function (e) {
            isDragging = true;
            startX = e.pageX - pdfContainer.offset().left;
            startY = e.pageY - pdfContainer.offset().top;
            scrollLeft = pdfContainer.scrollLeft();
            scrollTop = pdfContainer.scrollTop();
        });

        $(document).on('mousemove', function (e) {
            if (isDragging) {
                e.preventDefault();
                const x = e.pageX - pdfContainer.offset().left;
                const y = e.pageY - pdfContainer.offset().top;
                const walkX = x - startX;
                const walkY = y - startY;
                pdfContainer.scrollLeft(scrollLeft - walkX);
                pdfContainer.scrollTop(scrollTop - walkY);
            }
        });

        $(document).on('mouseup', function () {
            isDragging = false;
        });

    });

});