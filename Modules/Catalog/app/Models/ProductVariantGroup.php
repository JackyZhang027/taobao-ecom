<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariantGroup extends Model
{
    protected $fillable = ['product_id', 'name', 'sort_order', 'has_images'];

    protected $casts = ['has_images' => 'boolean'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(ProductVariantOption::class, 'group_id')->orderBy('sort_order');
    }
}
