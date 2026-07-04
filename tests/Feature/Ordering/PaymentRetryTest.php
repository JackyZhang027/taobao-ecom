<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Ordering\Models\Order;
use Modules\Payment\Models\Payment;
use Modules\Payment\Services\PaymentService;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    // Suppress Midtrans config warnings — server key is intentionally blank in tests.
    config(['midtrans.server_key' => 'test-server-key']);
});

function makeOrderCustomer(Order $order): User
{
    $role = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $order->user->assignRole($role);

    return $order->user;
}

// ─── PaymentService::createSnapToken ─────────────────────────────────────────

test('createSnapToken reuses the existing token while payment is pending', function () {
    $order = Order::factory()->pending()->create();
    $payment = Payment::factory()->pending()->for($order)->create();

    $token = app(PaymentService::class)->createSnapToken($order);

    expect($token)->toBe($payment->snap_token);
    expect(Payment::where('order_id', $order->id)->count())->toBe(1);
});

test('createSnapToken mints a fresh payment when the latest one is dead', function () {
    $order = Order::factory()->pending()->create();
    $oldPayment = Payment::factory()->expired()->for($order)->create();

    $service = $this->partialMock(PaymentService::class, function ($mock) {
        $mock->shouldAllowMockingProtectedMethods();
        $mock->shouldReceive('mintNewPayment')->once()->andReturnUsing(
            fn (Order $order) => Payment::factory()->pending()->for($order)->create()->snap_token
        );
    });

    $service->createSnapToken($order);

    expect(Payment::where('order_id', $order->id)->count())->toBe(2);
    expect($oldPayment->fresh()->status)->toBe('expire');
});

// ─── PaymentService::regenerateSnapToken ─────────────────────────────────────

test('regenerateSnapToken cancels the old transaction before minting a new one', function () {
    $order = Order::factory()->pending()->create();
    $oldPayment = Payment::factory()->pending()->for($order)->create();

    $service = $this->partialMock(PaymentService::class, function ($mock) {
        $mock->shouldAllowMockingProtectedMethods();
        $mock->shouldReceive('cancelTransaction')->once();
        $mock->shouldReceive('mintNewPayment')->once()->andReturnUsing(
            fn (Order $order) => Payment::factory()->pending()->for($order)->create()->snap_token
        );
    });

    $newToken = $service->regenerateSnapToken($order);

    expect($newToken)->not->toBe($oldPayment->snap_token);
    expect(Payment::where('order_id', $order->id)->count())->toBe(2);
    expect($oldPayment->fresh()->status)->toBe('pending'); // untouched locally — cancelTransaction only calls Midtrans
});

test('regenerateSnapToken throws when the order is already paid', function () {
    $order = Order::factory()->confirmed()->create();
    Payment::factory()->settlement()->for($order)->create();

    expect(fn () => app(PaymentService::class)->regenerateSnapToken($order))
        ->toThrow(RuntimeException::class);
});

// ─── OrderController::regeneratePayment endpoint ─────────────────────────────

test('regeneratePayment endpoint returns a fresh snap token', function () {
    $order = Order::factory()->pending()->create();
    Payment::factory()->pending()->for($order)->create();
    $customer = makeOrderCustomer($order);

    $this->partialMock(PaymentService::class, function ($mock) {
        $mock->shouldReceive('regenerateSnapToken')->once()->andReturn('new-snap-token');
    });

    $this->actingAs($customer)
        ->post(route('orders.regenerate-payment', $order))
        ->assertOk()
        ->assertJson(['snapToken' => 'new-snap-token']);
});

test('regeneratePayment endpoint rejects a non-owner', function () {
    $order = Order::factory()->pending()->create();
    Payment::factory()->pending()->for($order)->create();
    makeOrderCustomer($order);

    $other = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $other->assignRole($role);

    $this->actingAs($other)
        ->post(route('orders.regenerate-payment', $order))
        ->assertForbidden();
});

test('regeneratePayment endpoint rejects a non-pending order', function () {
    $order = Order::factory()->confirmed()->create();
    Payment::factory()->settlement()->for($order)->create();
    $customer = makeOrderCustomer($order);

    $this->actingAs($customer)
        ->post(route('orders.regenerate-payment', $order))
        ->assertStatus(422);
});

// ─── Schema regression: multiple payment rows are now allowed ───────────────

test('multiple payment rows can be created for the same order', function () {
    $order = Order::factory()->pending()->create();

    Payment::factory()->cancelled()->for($order)->create();
    Payment::factory()->pending()->for($order)->create();

    expect(Payment::where('order_id', $order->id)->count())->toBe(2);
    expect($order->fresh()->payment->status)->toBe('pending');
});
