<?php

namespace Drupal\elogger\Form;

use Drupal\Core\Entity\ContentEntityDeleteForm;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;

/**
 * Provides a form for deleting Elog entities.
 *
 * @ingroup elogger
 */
class ElogDeleteForm extends ContentEntityDeleteForm {

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    parent::submitForm($form, $form_state);
    // Set redirect to the Elog listing page.
    $form_state->setRedirect('view.elogger.elogs');
  }

  /**
   * {@inheritdoc}
   */
  public function getCancelUrl() {
    return new Url('view.elogger.elogs');
  }

}
