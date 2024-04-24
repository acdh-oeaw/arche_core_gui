<?php

namespace Drupal\arche_core_gui\PathProcessor;

use Drupal\Core\PathProcessor\InboundPathProcessorInterface;
use Symfony\Component\HttpFoundation\Request;

class ArcheGuiPathProcessor implements InboundPathProcessorInterface
{
    public function processInbound($path, Request $request)
    {
        if (strpos($path, '/discover/') === 0) {
            $names = preg_replace('|^\/discover\/|', '', $path);
            $names = str_replace('/', ':', $names);
            return "/discover/$names";
        }
        return $path;
    }
}
