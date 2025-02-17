<?php

namespace Drupal\arche_core_gui\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

class ExceptionSubscriber implements EventSubscriberInterface {

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    // You can adjust the priority if needed.
    $events[KernelEvents::EXCEPTION][] = ['onException', 0];
    return $events;
  }

  /**
   * Reacts to exceptions.
   *
   * @param \Symfony\Component\HttpKernel\Event\ExceptionEvent $event
   *   The event object.
   */
  public function onException(ExceptionEvent $event) {
    // Optionally, only process master requests.
    if ($event->getRequestType() !== HttpKernelInterface::MASTER_REQUEST) {
      return;
    }

    $exception = $event->getThrowable();

    // If the exception is an HttpException, get its status code.
    // Otherwise, default to 500 (Internal Server Error).
    $statusCode = ($exception instanceof HttpExceptionInterface)
      ? $exception->getStatusCode()
      : 500;

    // If it's a 500 error, create a custom response.
    if ($statusCode === 500) {
      $response = new Response();
      $response->setStatusCode(500);
      // Customize the response content as needed.
      $content = file_get_contents(DRUPAL_ROOT . '/themes/contrib/arche-theme-bs/templates/layout/page--500.html.twig');
      $response->setContent($content);
      $event->setResponse($response);
    }
  }
}
