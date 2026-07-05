<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Ordering\Models\Order;
use Modules\Payment\Models\Payment;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'midtrans_order_id' => 'ORDER-'.$this->faker->unique()->numberBetween(10000, 99999).'-'.time(),
            'snap_token' => $this->faker->uuid(),
            'status' => 'pending',
            'amount' => $this->faker->numberBetween(100000, 1000000),
            'gateway_response' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => 'pending']);
    }

    public function authorize(): static
    {
        return $this->state(['status' => 'authorize']);
    }

    public function settlement(): static
    {
        return $this->state(['status' => 'settlement']);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => 'cancel']);
    }

    public function expired(): static
    {
        return $this->state(['status' => 'expire']);
    }
}
