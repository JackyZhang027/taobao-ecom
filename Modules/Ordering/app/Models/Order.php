<?php

namespace Modules\Ordering\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Payment\Models\Payment;

class Order extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\OrderFactory::new();
    }

    protected $fillable = [
        'user_id',
        'status',
        'subtotal_idr',
        'shipping_idr',
        'grand_total_idr',
        'exchange_rate_snapshot',
        'recipient_name',
        'recipient_phone',
        'street_address',
        'city',
        'province',
        'postal_code',
        'notes',
        'courier',
        'tracking_number',
        'order_number',
        'payment_reminder_count',
        'last_payment_reminder_at',
    ];

    protected static function booted(): void
    {
        static::created(function (Order $order) {
            $order->updateQuietly([
                'order_number' => sprintf(
                    'OR-%s-%05d',
                    $order->created_at->format('Ymd'),
                    $order->id,
                ),
            ]);
        });
    }

    protected $casts = [
        'subtotal_idr' => 'float',
        'shipping_idr' => 'float',
        'grand_total_idr' => 'float',
        'exchange_rate_snapshot' => 'float',
        'last_payment_reminder_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(OrderLine::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany('id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at');
    }
}
