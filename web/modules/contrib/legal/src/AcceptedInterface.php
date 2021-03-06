<?php

namespace Drupal\legal;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\user\EntityOwnerInterface;
use Drupal\Core\Entity\EntityChangedInterface;

/**
 * Provides an interface defining a Terms & Conditions Accepted entity.
 *
 * @ingroup legal
 */
interface AcceptedInterface extends ContentEntityInterface, EntityOwnerInterface, EntityChangedInterface {

}
