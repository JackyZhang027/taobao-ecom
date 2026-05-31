<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderLine;

class OrderLineFactory extends Factory
{
    protected $model = OrderLine::class;

    public function definition(): array
    {
        $unitPrice = $this->faker->numberBetween(50000, 500000);
        $qty       = $this->faker->numberBetween(1, 5);

        return [
            'order_id'           => Order::factory(),
            'product_id'         => null,
            'product_variant_id' => null,
            'product_name'       => $this->faker->words(3, true),
            'variant_name'       => null,
            'sku'                => $this->faker->bothify('SKU-##??'),
            'unit_price_idr'     => $unitPrice,
            'quantity'           => $qty,
            'subtotal_idr'       => $unitPrice * $qty,
        ];
    }
}
