<?php

namespace Drupal\elogger\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\elogger\Services\Elogger;
use Drupal\Core\Render\RendererInterface;

/**
 * Configure ElogLogMessagesConfigForm form.
 */
class ElogLogMessagesConfigForm extends ConfigFormBase {
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
   * The event logger service.
   *
   * @var \Drupal\elogger\Services\Elogger
   */
  protected $elogger;

  /**
   * The renderer.
   *
   * @var \Drupal\Core\Render\RendererInterface
   */
  protected $renderer;

  /**
   * Constructs a new ElogLogMessagesConfigForm.
   *
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler.
   * @param \Drupal\elogger\Services\Elogger $elogger
   *   The event logger service.
   * @param \Drupal\Core\Render\RendererInterface $renderer
   *   The renderer.
   */
  public function __construct(
    ModuleHandlerInterface $module_handler,
    Elogger $elogger,
    RendererInterface $renderer
  ) {
    $this->moduleHandler = $module_handler;
    $this->eLogger = $elogger;
    $this->renderer = $renderer;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('module_handler'),
      $container->get('elogger.logger'),
      $container->get('renderer')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'elog_log_messages_config';
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
    $form = parent::buildForm($form, $form_state);

    $log_message_templates = $config->get('log_message_templates');
    // Get all possible event types.
    $event_types = $this->eLogger->getEventTypes();

    $form['wrapper'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Customize message templates'),
      '#collapsible' => FALSE,
    ];

    // Display a cofigurable textarea for each log message event type in part.
    foreach ($event_types as $type => $type_label) {
      $tokens = [
        '{entity_type}: The entity type was affected. For ex: file, node, user, term etc.',
        '{entity}: The entity label or (if possible), the view url. For ex: the user view url, or node url.',
      ];

      if ($type == 'actions') {
        $tokens = ['{form_id}: The submitted form id string.'];
      }
      $tokens[] = '{user}: The user name linked to his profile.';

      // Build the built in tokens list and render them.
      $tokens_list = ['#theme' => 'item_list', '#items' => $tokens];
      $build_in_tokens = $this->renderer->render($tokens_list);

      $form['wrapper'][$type] = [
        '#type' => 'textarea',
        '#title' => $type_label,
        '#default_value' => !empty($log_message_templates[$type]) ? $log_message_templates[$type] : '',
        '#required' => TRUE,
        '#description' => $this->t(
          'You can also use these built-in tokens:@build_in_tokens.',
          ['@build_in_tokens' => $build_in_tokens]
        ),
      ];
      $form['wrapper']["token_tree_$type"] = [
        '#theme' => 'token_tree_link',
        '#show_restricted' => TRUE,
        '#show_nested' => TRUE,
      ];
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $log_message_templates = [];
    foreach (array_keys($this->eLogger->getEventTypes()) as $type) {
      $log_message_templates[$type] = $form_state->getValue($type);
    }
    // Retrieve the configuration.
    $this->configFactory->getEditable(static::SETTINGS)
      ->set('log_message_templates', $log_message_templates)
      ->save();

    parent::submitForm($form, $form_state);
  }

}
