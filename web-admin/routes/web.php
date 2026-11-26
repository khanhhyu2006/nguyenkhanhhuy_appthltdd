<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

if (config('billtrack.demo')) {
    Route::redirect('/', '/demo.html');
    Route::redirect('/login', '/demo.html');
    return;
}

Route::get('/login', [AdminController::class, 'loginForm'])->name('login');
Route::post('/login', [AdminController::class, 'login'])->middleware('throttle:6,1');
Route::post('/logout', [AdminController::class, 'logout'])->name('logout');
Route::get('/', [AdminController::class, 'overview'])->name('overview');
Route::get('/{section}', [AdminController::class, 'catalog'])->whereIn('section', ['templates', 'categories', 'rates'])->name('catalog');
Route::post('/{section}', [AdminController::class, 'save'])->whereIn('section', ['templates', 'categories', 'rates'])->name('catalog.save');
Route::delete('/{section}/{id}', [AdminController::class, 'delete'])->whereIn('section', ['templates', 'categories', 'rates'])->whereNumber('id')->name('catalog.delete');

Route::get('/data/{section}', [AdminController::class, 'dataset'])->whereIn('section', array_keys(config('admin-data')))->name('dataset');
