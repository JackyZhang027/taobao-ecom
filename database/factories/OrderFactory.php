<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Ordering\Models\Order;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = $this->faker->numberBetween(100000, 1000000);
        $shipping = $this->faker->numberBetween(0, 50000);

        return [
            'user_id'                => User::factory(),
            'status'                 => 'pending',
            'subtotal_idr'           => $subtotal,
            'shipping_idr'           => $shipping,
            'grand_total_idr'        => $subtotal + $shipping,
            'exchange_rate_snapshot' => 2200.00,
            'recipient_name'         => $this->faker->name(),
            'recipient_phone'        => $this->faker->phoneNumber(),
            'street_address'         => $this->faker->streetAddress(),
            'city'                   => $this->faker->city(),
            'province'               => $this->faker->state(),
            'postal_code'            => $this->faker->postcode(),
            'notes'                  => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => 'pending']);
    }

    public function confirmed(): static
    {
        return $this->state(['status' => 'confirmed']);
    }

    public function processing(): static
    {
        return $this->state(['status' => 'processing']);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => 'cancelled']);
    }
}
