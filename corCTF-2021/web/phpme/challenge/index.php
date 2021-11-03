<?php
    include "secret.php";

    // https://stackoverflow.com/a/6041773
    function isJSON($string) {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if(isset($_COOKIE['secret']) && $_COOKIE['secret'] === $secret) {
            // https://stackoverflow.com/a/7084677
            $body = file_get_contents('php://input');
            if(isJSON($body) && is_object(json_decode($body))) {
                $json = json_decode($body, true);
                if(isset($json["yep"]) && $json["yep"] === "yep yep yep" && isset($json["url"])) {
                    echo "<script>\n";
                    echo "    let url = '" . htmlspecialchars($json["url"]) . "';\n";
                    echo "    navigator.sendBeacon(url, '" . htmlspecialchars($flag) . "');\n";
                    echo "</script>\n";
                }
                else {
                    echo "nope :)";
                }
            }
            else {
                echo "not json bro";
            }
        }
        else {
            echo "ur not admin!!!";
        }
    }
    else {
        show_source(__FILE__);
    }
?>