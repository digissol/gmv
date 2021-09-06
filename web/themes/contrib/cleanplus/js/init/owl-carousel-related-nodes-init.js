(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.mtowlCarouselRelatedNodes = {
    attach: function (context, settings) {
      $(context).find('.mt-carousel-related-nodes').once('mtowlCarouselRelatedNodesInit').each(function() {
        $(this).owlCarousel({
          items: 2,
          responsive:{
            0:{
              items:2,
            },
            480:{
              items:3,
            },
            768:{
              items:4,
            },
            992:{
              items:2,
            },
            1200:{
              items:3,
            },
            1680:{
              items:3,
            }
          },
          autoplay: drupalSettings.cleanplus.owlCarouselRelatedNodesInit.owlRelatedNodesAutoPlay,
          autoplayTimeout: drupalSettings.cleanplus.owlCarouselRelatedNodesInit.owlRelatedNodesEffectTime,
          nav: true,
          dots: false,
          loop: true,
          navText: false
        });
      });
    }
  };
})(jQuery, Drupal, drupalSettings);
