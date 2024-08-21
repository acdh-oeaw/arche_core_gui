<?php

namespace Drupal\arche_core_gui\TwigExtension;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class ArcheTwigDateExtension extends \Twig\Extension\AbstractExtension {

    public function getFilters() {
        return [new \Twig\TwigFilter('archeTranslateDateFilter', function ($value, $dateformat) {
                        (isset($_SESSION['language'])) ? $lang = strtolower($_SESSION['language']) : $lang = "en";
                        
                        if (strpos($value, "Z") !== false) {
                            $value = str_replace("Z", "", $value);
                        }
                        if ($this->checkYearIsMoreThanFourDigit($value)) {
                            return $this->notNormalDate($value, $lang, $dateformat);
                        }
                        return $this->returnFormattedDate($dateformat, $value, $lang);
                    })
        ];
    }

    /**
     * Gets a unique identifier for this Twig extension.
     */
    public function getName() {
        return 'arche_core_gui.twig_extension';
    }

    private function checkYearIsMoreThanFourDigit($value): bool {
        $explode = explode("-", $value);
        if (strlen($explode[0]) > 4) {
            return true;
        }
        return false;
    }

    private function checkDateTimeValue($value) {
        $datetime = new \DateTime();
        $newDate = $datetime->createFromFormat('Y-m-d', $value);
        if ($newDate) {
            return $newDate->format('Y-m-d H:i:s');
        }
        return $value;
    }

    /**
     * Return the normal 4 digit year dates
     * @param type $dateformat
     * @param type $value
     * @param type $lang
     * @return string
     */
    private function returnFormattedDate($dateformat, $value, $lang): string {

        $date = new \DateTime($value);
        // Determine if the date is before the Gregorian calendar was adopted.
        $gregorian_start = new \DateTime('1582-10-15');

        if ($date < $gregorian_start && (strtolower($dateformat) === 'yyyy' || strtolower($dateformat) === 'y')) {
            // For dates before Gregorian calendar, directly extract the year.
            return $date->format('Y');
        } 
        
        $formatter = new \IntlDateFormatter($lang, \IntlDateFormatter::NONE, \IntlDateFormatter::NONE, null, null, $dateformat);
        // Format the date and return the year.
        return $formatter->format($date);        
    }

    /**
     * Return the befrore christ dates where we have 5 digit years numbers
     * @param type $value
     * @return string
     */
    private function notNormalDate($value, $lang, $dateformat): string {
        ini_set('date.timezone', 'UTC');
        ini_set('intl.default_locale', 'en_US');
        setlocale(LC_TIME, 'en_US.utf8');

        if ($lang == 'de') {
            ini_set('intl.default_locale', 'de_DE');
            setlocale(LC_TIME, 'de_DE.utf8');
        }
        $e = explode("-", $value);

        $y = $e[0];
        $m = $e[1];
        $d = $e[2];

        switch ($dateformat) {
            case 'Y':
                return $y;
            case 'd-m-Y':
                return $m . '-' . $d . '-' . $y;
            case 'd-m-y':
                return $m . '-' . $d . '-' . $y;
            case 'd M Y':
                return $d . '-' . date('M', $m) . '-' . $y;
            case 'd M y':
                return $d . '-' . date('M', $m) . '-' . $y;
            case 'Y M d':
                return $y . '-' . date('M', $m) . '-' . $d;
            case 'y M d':
                return $y . '-' . date('M', $m) . '-' . $d;
            default:
                return $y . '-' . $m . '-' . $d;
        }
    }
}
