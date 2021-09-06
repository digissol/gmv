(function ($, Drupal, drupalSettings) {

  'use strict';

  Drupal.behaviors.EloggerJsonPanel = {
    attach: function (context, settings) {

      $('.jsonpanel', context).each(function() {
        var hash = $(this).data('hash');
        if (hash) {
          $(this).jsonpanel({data: settings.jsonpanel[hash]});
        }
      })
    }
  };

})(jQuery, Drupal, drupalSettings);
