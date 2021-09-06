<?php

namespace Drupal\elogger\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configure ElogFiltersConfigForm form.
 */
class ElogFiltersConfigForm extends ConfigFormBase {
  use StringTranslationTrait;

  /**
   * Config settings.
   *
   * @var string
   */
  const SETTINGS = 'elogger.settings';

  /**
   * The module handler.
   *
   * @var \Drupal\Core\Extension\ModuleHandlerInterface
   */
  protected $moduleHandler;

  /**
   * Constructs a new ElogFiltersConfigForm.
   *
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler.
   */
  public function __construct(ModuleHandlerInterface $module_handler) {
    $this->moduleHandler = $module_handler;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('module_handler')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'elog_filters_config';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      static::SETTINGS,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config(static::SETTINGS);

    $options = [];
    foreach (array_keys($this->moduleHandler->getModuleList()) as $module) {
      $options[$module] = $module;
    }
    unset($options['elogger']);

    $form['modules'] = [
      '#type' => 'select',
      '#title' => $this->t('Modules'),
      '#default_value' => $config->get('modules') ? $config->get('modules') : [],
      '#options' => $options,
      '#multiple' => TRUE,
      '#required' => TRUE,
      '#description' => $this->t('Select the list of modules for monitoring event logging.'),
      '#size' => 20,
    ];
    $form['actions_forms'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Actions: Forms ids'),
      '#default_value' => $config->get('actions_forms') ? $config->get('actions_forms') : '',
      '#required' => TRUE,
      '#description' => $this->t('Set with form ids to track for logs. User "*" to track all forms or set the form ids, each one in new line.'),
    ];
    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $this->configFactory->getEditable(static::SETTINGS)
      ->set('modules', $form_state->getValue('modules'))
      ->set('actions_forms', $form_state->getValue('actions_forms'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}
