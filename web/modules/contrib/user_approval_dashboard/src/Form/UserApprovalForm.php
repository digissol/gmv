<?php

namespace Drupal\user_approval_dashboard\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Class UserApprovalForm.
 */
class UserApprovalForm extends FormBase {

  /**
   * Request stack.
   *
   * @var RequestStack
   */
  public $request;

  /**
   * Class constructor.
   *
   * @param RequestStack $request
   *   Request stack.
   */

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs a UserApprovalForm object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(RequestStack $request, EntityTypeManagerInterface $entity_type_manager) {
    $this->request = $request;
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('request_stack'),
      $container->get('entity_type.manager')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'user_approval_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['message'] = [
      '#markup' => '<div class="approve">Are you sure to approve this account? If so, Click approve.</div>',
    ];
    $form['uad'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['uad-container'],
      ],
    ];
    $form['uad']['cancel'] = [
      '#type' => 'button',
      '#value' => $this->t('Cancel'),
      '#attributes' => [
        'data-dismiss' => ['modal'],
        'class' => ['uad-approve'],
      ],
    ];
    $form['uad']['submit'] = [
      '#type' => 'submit',
      '#attributes' => [
        'class' => ['uad-approve'],
      ],
      '#value' => $this->t('Approve'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $uid = $this->request->getCurrentRequest()->get('id');
    if ($uid && is_numeric($uid)) {
      $user = $this->entityTypeManager()->getStorage('user')->load($uid);
      if (is_object($user)) {
        $user->activate();
        $user->save();
        $message = $this->t('Account has been activated successfully');
        $this->messenger()->addStatus($message);
        $url = Url::fromRoute('view.dashboard.user_dashboard');
        // After activating the user, redirect to the dashboard.
        $form_state->setRedirectUrl($url);
      }
    }
  }

}
