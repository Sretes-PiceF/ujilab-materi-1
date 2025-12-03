<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('logbook', function (Blueprint $table) {
            $table->string('original_image')->nullable()->after('file');
            $table->string('thumbnail')->nullable()->after('original_image');
            $table->string('webp_image')->nullable()->after('thumbnail');
            $table->string('webp_thumbnail')->nullable()->after('webp_image');
            $table->integer('original_size')->nullable()->after('webp_thumbnail');
            $table->integer('optimized_size')->nullable()->after('original_size');
            $table->string('image_format')->default('jpg')->after('optimized_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('logbook', function (Blueprint $table) {
            //
        });
    }
};
