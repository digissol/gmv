## Event Logger

A module which is used for tracking all the possible drupal system
events with a variety of features around it.

### Features
Can set a system message including tokens for any type of CRUD entity
actions or form submissions. Now, all your forms submission data
can be logged and tracked for a purpose.

Once an entity performs any updates into the fields we can now track
it via a diff visualization into the logs listing which will keep us
a transparent view of who, when, and what exactly fields were changed.

Can configure which specter of modules we want to track the events,
also filter them into logs listing. Also, set the specific forms we
want to track the submissions, or just track all we do have on the
site (including custom forms).

Can export and perform the full CRUD actions to the logs.

### Dependencies
* `https://www.drupal.org/project/token`
* `https://www.drupal.org/project/views`
* `https://www.drupal.org/project/views_data_export`
* `https://www.drupal.org/project/diff`

### Configuration pages
* Admin events logger listing: `admin/reports/elogger`
* Config page: `admin/config/system/elogger`

It has an internal drupal service for this purpose. Here are examples of usage:

```php
$elog_service = \Drupal::service('elogger.logger');

// Log an an entity event log like creation, update, delete of a Drupal entity.
// $entity: a Drupal "EntityInterface" instance like node, term, user, menu_link etc.
$elog_service->setEntity($entity);
$elog_service->logEvent('entity_create');


/**
 * Implements hook_form_alter().
 */
function elogger_form_alter(&$form, FormStateInterface $form_state, $form_id) {
  // Log a form submit event. It will also log the submitted form data.
  $elog_service->setForm($form, $form_state);
  $elog_service->logEvent('actions');
}
```
