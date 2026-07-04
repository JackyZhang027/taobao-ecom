<?php

use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Admin\Models\Faq;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(fn () => Cache::flush());

function makeLocalizedProduct(): Product
{
    $product = Product::create([
        'slug' => 'test-product',
        'delivery_rate_batam' => 0,
        'delivery_rate_jakarta' => 0,
    ]);

    $product->translations()->createMany([
        ['locale' => 'en', 'name' => 'English Name', 'description' => 'Desc EN'],
        ['locale' => 'id', 'name' => 'Nama Indonesia', 'description' => 'Desc ID'],
    ]);

    return $product;
}

test('product page shows English content with no locale cookie', function () {
    $product = makeLocalizedProduct();

    $this->get("/products/{$product->slug}")
        ->assertInertia(fn (Assert $page) => $page->where('product.name', 'English Name'));
});

test('product page shows Indonesian content when locale cookie is id', function () {
    $product = makeLocalizedProduct();

    $this->withUnencryptedCookie('locale', 'id')
        ->get("/products/{$product->slug}")
        ->assertInertia(fn (Assert $page) => $page->where('product.name', 'Nama Indonesia'));
});

test('an invalid locale cookie falls back to default locale', function () {
    $product = makeLocalizedProduct();

    $this->withUnencryptedCookie('locale', 'fr')
        ->get("/products/{$product->slug}")
        ->assertInertia(fn (Assert $page) => $page->where('product.name', 'English Name'));
});

test('faq page respects locale cookie', function () {
    $faq = Faq::create(['sort_order' => 1, 'is_active' => true]);
    $faq->translations()->createMany([
        ['locale' => 'en', 'question' => 'English question?', 'answer' => 'EN'],
        ['locale' => 'id', 'question' => 'Pertanyaan Indonesia?', 'answer' => 'ID'],
    ]);

    $this->withUnencryptedCookie('locale', 'id')
        ->get('/faq')
        ->assertInertia(fn (Assert $page) => $page->where('faqs.0.question', 'Pertanyaan Indonesia?'));
});

test('category name switches with locale on categories index page', function () {
    Category::create(['name' => 'Electronics', 'name_id' => 'Elektronik', 'slug' => 'electronics', 'sort_order' => 0]);

    $this->withUnencryptedCookie('locale', 'id')
        ->get('/categories')
        ->assertInertia(fn (Assert $page) => $page->where('categories.0.name', 'Elektronik'));

    $this->withUnencryptedCookie('locale', 'en')
        ->get('/categories')
        ->assertInertia(fn (Assert $page) => $page->where('categories.0.name', 'Electronics'));
});

test('category name switches with locale on the homepage', function () {
    Category::create(['name' => 'Electronics', 'name_id' => 'Elektronik', 'slug' => 'electronics', 'sort_order' => 0]);

    $this->withUnencryptedCookie('locale', 'id')
        ->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where('categories.0.name', 'Elektronik'));
});

test('category name switches with locale on the shop page filter list', function () {
    Category::create(['name' => 'Electronics', 'name_id' => 'Elektronik', 'slug' => 'electronics', 'sort_order' => 0]);

    $this->withUnencryptedCookie('locale', 'id')
        ->get(route('shop.index'))
        ->assertInertia(fn (Assert $page) => $page->where('categories.0.name', 'Elektronik'));
});

test('category falls back to English name when name_id is empty even in id locale', function () {
    Category::create(['name' => 'Electronics', 'name_id' => null, 'slug' => 'electronics', 'sort_order' => 0]);

    $this->withUnencryptedCookie('locale', 'id')
        ->get('/categories')
        ->assertInertia(fn (Assert $page) => $page->where('categories.0.name', 'Electronics'));
});

test('category listing under two different locale cookies is not served from a stale shared cache', function () {
    Category::create(['name' => 'Electronics', 'name_id' => 'Elektronik', 'slug' => 'electronics', 'sort_order' => 0]);

    $this->withUnencryptedCookie('locale', 'id')->get(route('home'));

    $this->withUnencryptedCookie('locale', 'en')
        ->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where('categories.0.name', 'Electronics'));
});
