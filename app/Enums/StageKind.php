<?php

namespace App\Enums;

enum StageKind: string
{
    case Open = 'open';
    case Won = 'won';
    case Lost = 'lost';
}
