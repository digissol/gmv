<?php

namespace Drupal\elogger\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\user\EntityOwnerInterface;
use Drupal\Core\Entity\EntityChangedInterface;

/**
 * Provides an interface defining a Elog entity.
 *
 * @ingroup elogger
 */
interface ElogInterface extends ContentEntityInterface, EntityOwnerInterface, EntityChangedInterface {}
