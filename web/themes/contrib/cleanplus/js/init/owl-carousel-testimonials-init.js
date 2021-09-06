(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.mtowlCarouselTestimonials = {
    attach: function (context, settings) {
      $(context).find('.mt-carousel-testimonials').once('mtowlCarouselTestimonialsInit').each(function() {
        $(this).owlCarousel({
          items: 1,
          autoplay: drupalSettings.cleanplus.owlCarouselTestimonialsInit.owlTestimonialsAutoPlay,
          autoplayTimeout: drupalSettings.cleanplus.owlCarouselTestimonialsInit.owlTestimonialsEffectTime,
          nav: true,
          dots: false,
          loop: false,
          navText: false
        });
      });
    }
  };
})(jQuery, Drupal, drupalSettings);
