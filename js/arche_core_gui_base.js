(function (Drupal, drupalSettings) {
  'use strict';
  var currentLanguage = drupalSettings.path.currentLanguage.language;
  console.log("The current site language is: " + currentLanguage);
  
  
})(Drupal, drupalSettings);