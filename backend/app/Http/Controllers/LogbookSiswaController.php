<?php

namespace App\Http\Controllers;

use App\Models\Logbook;
use App\Models\Siswa;
use Illuminate\Http\Request;

class LogbookSiswaController extends Controller {

    public function index () 
    {
        $data = Logbook::all();
        return response()->json([
            'message' => "Success",
            "data" => $data
        ]);
    }

    public function show()
    {

    }

    public function update()
    {

    }

    public function destroy()
    {

    }
}
