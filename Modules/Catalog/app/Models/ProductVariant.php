<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ProductVariant extends Model implements HasMedia
{
    use SoftDeletes, InteractsWithMedia;

    protected $fillable = [
        'product_id',
        'sku',
        'price',
        'compare_price',
        'delivery_rate_batam',
        'delivery_rate_jakarta',
        'stock',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price'                 => 'float',
        'compare_price'         => 'float',
        'delivery_rate_batam'   => 'float',
        'delivery_rate_jakarta' => 'float',
        'is_active'               => 'boolean',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('image')->singleFile();
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function options(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductVariantOption::class,
            'product_variant_option_assignments',
            'product_variant_id',
            'option_id'
        )->with('group');
    }

    public function getOptionKeyAttribute(): string
    {
        $ids = $this->options->pluck('id')->sort()->values()->toArray();
        return implode('|', $ids);
    }
}
