(function ($, Drupal, drupalSettings) {
Drupal.behaviors.my_behav =  {
  attach: function (context, settings) {
console.log("test00");	
		// This ensures the code is only run once:
    $(".block-group-operations").find('div').each(function () {
      // Do stuff here. It will only be executed once.
	  console.log("test3");
  $(this).removeClass();
    });
	

   
  }
}
} (jQuery, Drupal, drupalSettings));

