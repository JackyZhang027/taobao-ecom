<?php

namespace Modules\Payment\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Ordering\Models\Order;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'midtrans_order_id',
        'snap_token',
        'status',
        'amount',
        'gateway_response',
    ];

    protected $casts = [
        'amount' => 'float',
        'gateway_response' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
