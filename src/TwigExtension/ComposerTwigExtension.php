<?php

namespace Drupal\arche_core_gui\TwigExtension;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class ComposerTwigExtension extends \Twig\Extension\AbstractExtension
{

    /**
     * {@inheritdoc}
     * This function must return the name of the extension. It must be unique.
     */
    public function getName()
    {
        return 'arche_core_gui_composer.twig_extension';
    }

    public function getFunctions()
    {
        return [
            new \Twig\TwigFunction('get_acdh_composer_versions', [$this, 'get_acdh_composer_versions']),
        ];
    }

    public function get_acdh_composer_versions(string $name = "")
    {
        $composerContent = $this->getComposerFile('/home/www-data/gui/composer.lock');
         
        return $this->processGuiComposerFile($composerContent);
        
    }
    
    private function processGuiComposerFile(array $file): string
    {
        $str = "";
        if (count((array)$file) > 0) {
            foreach ($file as $v) {
                if (strpos($v->name, 'acdh-oeaw/') !== false) {
                    $url = str_replace('acdh-oeaw/', 'https://packagist.org/packages/acdh-oeaw/', $v->name);
                    $str.= "<span><a href='".$url."' target='_blank' >".str_replace('acdh-oeaw/', '', $v->name)." : ".$v->version.".</a></span>| ";
                }
            }
            $str = substr($str, 0, -2);
        }
        return $str;
    }
    
    private function getComposerFile(string $url): array
    {
        $data = new \stdClass();
        $data = json_decode(file_get_contents($url));
        if (count((array)$data) == 0) {
            return new \stdClass();
        }
        
        if (count((array)$data->packages) == 0) {
            return new \stdClass();
        }
        
        return $data->packages;
    }
}
