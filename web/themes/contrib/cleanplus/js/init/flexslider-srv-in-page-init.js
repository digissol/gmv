(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.mtflexsliderInPage = {
    attach: function (context, settings) {

      // store the slider in a local variable
      var $window = $(window),
      flexslider;

      $(context).find('.in-page-images-slider').once('mtflexsliderInPageSliderInit').each(function() {
        $(this).flexslider({
          animation: drupalSettings.cleanplus.flexsliderInPageInit.inPageSliderEffect,
          controlNav: true,
          directionNav: false,
          slideshow: true,
        });

        $(this).fadeIn("slow");

      });

    }
  };
})(jQuery, Drupal, drupalSettings);