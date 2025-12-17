<?php

use Illuminate\Support\Facades\Broadcast;

// Public channel - anyone can listen
Broadcast::channel('magang', function () {
    return true;
});
