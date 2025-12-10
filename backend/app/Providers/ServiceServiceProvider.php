<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class ServiceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Auto-register all Services
        $servicesPath = app_path('Services');

        if (is_dir($servicesPath)) {
            $files = scandir($servicesPath);

            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
                    $className = 'App\\Services\\' . pathinfo($file, PATHINFO_FILENAME);
                    $this->app->singleton($className, function () use ($className) {
                        return new $className();
                    });
                }
            }
        }
    }
}
