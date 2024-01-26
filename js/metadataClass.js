(function ($) {

    $.fn.MetadataClass = function (dataSet) {
    // Your class methods go here
    var data = dataSet.data;
    
    
    this.getAvailableDate = function () {
        return data["acdh:hasAvailableDate"].en[0].value ? data["acdh:hasAvailableDate"].en[0].value : "";
    }
    
    this.getTitle = function () {
        return data["acdh:hasTitle"].en[0].value ? data["acdh:hasTitle"].en[0].value : "";
    }
    
    this.getType = function () {
        return data["rdf:type"].en[0].value ? data["rdf:type"].en[0].value : "";
    }
   

    return this; // Allow chaining
  };
    
})(jQuery);