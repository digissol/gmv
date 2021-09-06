<?php

namespace Drupal\elogger\Services;

use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\Core\Entity\EntityInterface;
use Drupal\elogger\Entity\Elog;
use Drupal\Core\Datetime\DateFormatter;
use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Link;
use Drupal\Core\Url;
use Drupal\diff\DiffEntityComparison;
use Symfony\Component\HttpFoundation\Session\Session;
use Drupal\diff\Plugin\diff\Layout\UnifiedFieldsDiffLayout;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Utility\Token;
use Exception;

/**
 * Class Elogger.
 */
class Elogger extends UnifiedFieldsDiffLayout {
  use StringTranslationTrait;

  /**
   * Retrieves the entity interface, or the form data, or null.
   *
   * @var null|array|\Drupal\Core\Entity\EntityInterface
   */
  protected $logContext;

  /**
   * Retrieves curent user account data.
   *
   * @var \Drupal\Core\Entity\EntityInterface|null
   */
  protected $currentUserAccount;

  /**
   * Retrieves the entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Gets the current active user.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The diff entity comparison service.
   *
   * @var \Drupal\diff\DiffEntityComparison
   */
  protected $entityComparison;

  /**
   * The renderer.
   *
   * @var \Drupal\Core\Render\RendererInterface
   */
  protected $renderer;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The token service.
   *
   * @var \Drupal\Core\Utility\Token
   */
  protected $token;

  /**
   * The session service.
   * 
   * @var \Symfony\Component\HttpFoundation\Session\Session
   */
  protected $session;

  /**
   * Constructs a new Elogger object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Session\AccountProxyInterface $current_user
   *   Current account.
   * @param \Drupal\Core\Datetime\DateFormatter $date_formatter
   *   The date formatter.
   * @param \Drupal\diff\DiffEntityComparison $entity_comparison
   *   The diff entity comparison service.
   * @param \Drupal\Core\Render\RendererInterface $renderer
   *   The renderer.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Utility\Token $token
   *   The token service.
   * @param \Symfony\Component\HttpFoundation\Session\Session $session
   *   The session service.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    AccountProxyInterface $current_user,
    DateFormatter $date_formatter,
    DiffEntityComparison $entity_comparison,
    RendererInterface $renderer,
    ConfigFactoryInterface $config_factory,
    Token $token,
    Session $session
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->currentUser = $current_user;
    $this->dateFormatter = $date_formatter;
    $this->entityComparison = $entity_comparison;
    $this->renderer = $renderer;
    $this->configFactory = $config_factory;
    $this->token = $token;
    $this->session = $session;

    $this->currentUserAccount = $this
      ->entityTypeManager
      ->getStorage('user')
      ->load($this->currentUser->id());

    $this->logContext = NULL;
  }

  /**
   * Get available event types.
   *
   * @return array
   *   Return the event types.
   */
  public function getEventTypes() {
    return [
      'entity_create' => $this->t('Entity create'),
      'entity_update' => $this->t('Entity update'),
      'entity_delete' => $this->t('Entity delete'),
      'actions' => $this->t('Actions'),
    ];
  }

  /**
   * Perform the entity diff for a particular entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The affected entity for processing.
   *
   * @return mixed
   *   Return the full diff array data for this particular entity.
   */
  protected function entityDiff(EntityInterface $entity) {
    $entity_session_id = $entity->id() . $entity->uuid();
    // First, get the original entity before change.
    $before_update = $this->session->get($entity_session_id);
    $this->session->remove($entity_session_id);

    if (!$before_update instanceof EntityInterface) {
      return NULL;
    }
    // Serialize the array diff data and put it into db.
    return serialize($this->entityComparison->compareRevisions(
      $before_update,
      $entity
    ));
  }

  /**
   * Build the form data output as a jsonpanel format.
   *
   * @param array $form_data
   *   The form submitted data. The result of getValues().
   *
   * @return \Drupal\Component\Render\MarkupInterface
   *   The rendered HTML of the form data.
   */
  public function buildFormData(array $form_data) {
    $hash = sha1(json_encode($form_data));
    $build['wrapper'] = [
      '#type' => 'details',
      '#title' => $this->t('Show form data'),
      '#open' => FALSE,
    ];
    $build['wrapper']['form_data'] = [
      '#markup' => "<div class='jsonpanel' data-hash='$hash'></div>",
    ];
    $build['#attached']['drupalSettings']['jsonpanel'][$hash] = $form_data;
    $build['#attached']['library'][] = 'elogger/elogger-jsonpanel';

    return $this->renderer->render($build);
  }

  /**
   * Build the diff outout of the entity.
   *
   * @param array $diff
   *   The diff of the entity before and after saving.
   *
   * @return null|\Drupal\Component\Render\MarkupInterface
   *   The rendered HTML or null in case there is no diff.
   */
  public function buildDiffOutput(array $diff) {
    // Build the diff rows for each field and append the field rows
    // to the table rows.
    $raw_active = 'raw';
    $diff_rows = [];
    foreach ($diff as $field) {
      $field_label_row = '';
      if (!empty($field['#name'])) {
        $field_label_row = [
          'data' => $field['#name'],
          'colspan' => 4,
          'class' => ['field-name'],
        ];
      }

      if (!$raw_active) {
        $field_settings = $field['#settings'];
        if (!empty($field_settings['settings']['markdown'])) {
          $field['#data']['#left'] = $this->applyMarkdown($field_settings['settings']['markdown'], $field['#data']['#left']);
          $field['#data']['#right'] = $this->applyMarkdown($field_settings['settings']['markdown'], $field['#data']['#right']);
        }
        // In case the settings are not loaded correctly use drupal_html_to_text
        // to avoid any possible notices when a user clicks on markdown.
        else {
          $field['#data']['#left'] = $this->applyMarkdown('drupal_html_to_text', $field['#data']['#left']);
          $field['#data']['#right'] = $this->applyMarkdown('drupal_html_to_text', $field['#data']['#right']);
        }
      }

      // Process the array (split the strings into single line strings)
      // and get line counts per field.
      $this->entityComparison->processStateLine($field);

      $field_diff_rows = $this->entityComparison->getRows(
        $field['#data']['#left'],
        $field['#data']['#right']
      );

      $final_diff = [];
      $row_count_left = NULL;
      $row_count_right = NULL;
      foreach ($field_diff_rows as $key => $value) {
        $show = FALSE;
        if (isset($field_diff_rows[$key][1]['data'])) {
          if ($field_diff_rows[$key][1] == $field_diff_rows[$key][3]) {
            $show = TRUE;
            $row_count_right++;
          }
          $row_count_left++;
          $final_diff[] = [
            'left-line-number' => [
              'data' => $row_count_left,
              'class' => [
                'diff-line-number', $field_diff_rows[$key][1]['class'],
              ],
            ],
            'right-line-number' => [
              'data' => $show ? $row_count_right : NULL,
              'class' => [
                'diff-line-number', $field_diff_rows[$key][1]['class'],
              ],
            ],
            'row-sign' => [
              'data' => isset($field_diff_rows[$key][0]['data']) ? $field_diff_rows[$key][0]['data'] : NULL,
              'class' => [
                isset($field_diff_rows[$key][0]['class']) ? $field_diff_rows[$key][0]['class'] : NULL,
                $field_diff_rows[$key][1]['class'],
              ],
            ],
            'row-data' => [
              'data' => $field_diff_rows[$key][1]['data'],
              'colspan' => 2,
              'class' => $field_diff_rows[$key][1]['class'],
            ],
          ];
        }
        if ($field_diff_rows[$key][1] != $field_diff_rows[$key][3]) {
          if (isset($field_diff_rows[$key][3]['data'])) {
            $row_count_right++;
            $final_diff[] = [
              'left-line-number' => [
                'data' => NULL,
                'class' => [
                  'diff-line-number', $field_diff_rows[$key][3]['class'],
                ],
              ],
              'right-line-number' => [
                'data' => $row_count_right,
                'class' => [
                  'diff-line-number', $field_diff_rows[$key][3]['class'],
                ],
              ],
              'row-sign' => [
                'data' => isset($field_diff_rows[$key][2]['data']) ? $field_diff_rows[$key][2]['data'] : NULL,
                'class' => [
                  isset($field_diff_rows[$key][2]['class']) ? $field_diff_rows[$key][2]['class'] : NULL,
                  $field_diff_rows[$key][3]['class'],
                ],
              ],
              'row-data' => [
                'data' => $field_diff_rows[$key][3]['data'],
                'colspan' => 2,
                'class' => $field_diff_rows[$key][3]['class'],
              ],
            ];
          }
        }
      }

      // Add field label to the table only if there are changes to that field.
      if (!empty($final_diff) && !empty($field_label_row)) {
        $diff_rows[] = [$field_label_row];
      }

      // Add field diff rows to the table rows.
      $diff_rows = array_merge($diff_rows, $final_diff);
    }

    if (!$raw_active) {
      // Remove line numbers.
      foreach ($diff_rows as $i => $row) {
        unset($diff_rows[$i]['left-line-number']);
        unset($diff_rows[$i]['right-line-number']);
      }

      // Reduce the colspan.
      $diff_rows[0][0]['colspan'] = 2;
    }

    // No visible changes for generating a diff data.
    if (empty($diff_rows)) {
      return NULL;
    }

    $build['wrapper'] = [
      '#type' => 'details',
      '#title' => 'Show diff',
      '#open' => FALSE,
    ];
    $build['wrapper']['diff'] = [
      '#type' => 'table',
      '#header' => [],
      '#rows' => $diff_rows,
      '#empty' => $this->t('No visible changes'),
      '#attributes' => ['class' => ['diff']],
    ];
    $build['#attached']['library'][] = 'diff/diff.single_column';
    $build['#attached']['library'][] = 'diff/diff.colors';

    return $this->renderer->render($build);
  }

  /**
   * Set the drupal entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The entity interface instance.
   */
  public function setEntity(EntityInterface $entity) {
    $this->logContext = $entity;
  }

  /**
   * Set the drupal form data.
   *
   * @param array $form
   *   The form array data.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state date.
   */
  public function setForm(array $form, FormStateInterface $form_state) {
    $this->logContext = ['form' => $form, 'form_state' => $form_state];
  }

  /**
   * Get the processed event log message.
   *
   * @param string $event_type
   *   The event type.
   * @param array $build_in_tokens
   *   The list of build-in tokens.
   *
   * @return string
   *   Return the processed log message.
   */
  protected function getProcessedLogMessage(string $event_type, array $build_in_tokens) {
    // Get elogger messages templates.
    $log_messages_config = $this->configFactory->get('elogger.settings');
    $log_message_templates = $log_messages_config->get('log_message_templates');
    if (!isset($log_message_templates[$event_type])) {
      throw new Exception("Could not find the log message template for: $event_type.");
    }
    // Replace drupal tokens.
    $message = $this->token->replace($log_message_templates[$event_type]);

    // Replace the build in tokens.
    return preg_replace(
      array_keys($build_in_tokens),
      array_values($build_in_tokens),
      $message
    );
  }

  /**
   * Prepare the log message having an entity.
   *
   * @param string $event_type
   *   The event type.
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The entity interface instance.
   *
   * @return array
   *   Return the message and entity diff (if exists).
   */
  protected function prepareEntityLogMessage(string $event_type, EntityInterface $entity) {
    // Try to get the entity label/title.
    foreach (['getName', 'getTitle', 'label'] as $title_key) {
      if (!method_exists($entity, $title_key)) {
        continue;
      }
      $entity_label = $entity->{$title_key}();
    }

    if ($entity->hasLinkTemplate('canonical') && $event_type != 'entity_delete') {
      $entity_label = $entity->toLink()->toString();
    }
    $entity_type = $entity->getEntityTypeId();

    // The entity of the type "view" does not provide a canonical url, so, we
    // formate the url using the class "Link".
    if ($entity_type == 'view' && $event_type != 'entity_delete') {
      $entity_label = Link::fromTextAndUrl(
        $entity_label,
        Url::fromUserInput('/admin/structure/views/view/' . $entity->id())
      )->toString();
    }

    if ($entity_type == 'menu' && $event_type != 'entity_delete') {
      $entity_label = Link::fromTextAndUrl(
        $entity_label,
        Url::fromUserInput('/admin/structure/menu/manage/' . $entity->id())
      )->toString();
    }
    $diff = NULL;
    // Add entity diff once it is a entity update event.
    if ($event_type == 'entity_update' && $entity instanceof ContentEntityInterface) {
      $diff = $this->entityDiff($entity);
    }

    // Define the build-in log tokens for entity logs.
    $build_in_tokens = [
      '/\{entity_type\}/' => $entity_type,
      '/\{entity\}/' => $entity_label,
      '/\{user\}/' => $this->currentUserAccount->toLink()->toString(),
    ];
    $message = $this->getProcessedLogMessage($event_type, $build_in_tokens);

    if (empty($message)) {
      throw new Exception('Could not build the log message. Something went wrong.');
    }
    return ['message' => $message, 'diff' => $diff];
  }

  /**
   * Callback used for logging an event.
   *
   * @param string $event_type
   *   The event type ex. entity_create, entity_update etc.
   */
  public function logEvent(string $event_type) {
    $log_context = $this->logContext;

    if ($event_type != 'actions' && !$log_context instanceof EntityInterface) {
      throw new Exception('You need to set an entity by using setEntity() method.');
    }

    // Do not process the log event itself.
    if ($log_context instanceof Elog) {
      return;
    }
    // Get elogger configs.
    $config = $this->configFactory->get('elogger.settings');

    $data = [
      'event_type' => $event_type,
      'user_id' => $this->currentUser->id(),
      'module' => NULL,
      'diff' => NULL,
      'log_message' => NULL,
      'form_data' => NULL,
    ];

    // Preprocess the entity CRUD operation events.
    if ($log_context instanceof EntityInterface) {
      $entity_class = explode('\\', get_class($log_context));
      $module = $entity_class[1];
      $allowed_modules = $config->get('modules');
      // Do not track the form once it's not added in configs.
      if (!in_array($module, $allowed_modules)) {
        return;
      }

      $message_data = $this->prepareEntityLogMessage($event_type, $log_context);
      $data['module'] = $module;
      $data['log_message'] = [
        'value' => $message_data['message'],
        'format' => 'full_html',
      ];
      $data['diff'] = $message_data['diff'];
    }

    // Preprocess form submit event.
    if ($event_type == 'actions') {
      if (!is_array($log_context) || empty($log_context['form']) || empty($log_context['form_state'])) {
        throw new Exception('Once the event type is "actions" you need to set a form by using setForm() method.');
      }
      $allowed_forms = $config->get('actions_forms');

      // First, we get the form id from log message.
      $form_id = $log_context['form']['form_id']['#value'];
      // Do not track the form once it's not added in configs.
      if (!empty($form_id) && strpos($allowed_forms, $form_id) === FALSE && $allowed_forms != '*') {
        return;
      }

      // Define the build-in log tokens for entity logs.
      $build_in_tokens = [
        '/\{form_id\}/' => $form_id,
        '/\{user\}/' => $this->currentUserAccount->toLink()->toString(),
      ];
      $message = $this->getProcessedLogMessage($event_type, $build_in_tokens);

      $data['log_message'] = ['value' => $message, 'format' => 'full_html'];
      $data['form_data'] = serialize($log_context['form_state']->getValues());
    }

    // Add the log into drupal db.
    $elog = $this->entityTypeManager->getStorage('elog')->create($data);
    $elog->save();
  }

}
