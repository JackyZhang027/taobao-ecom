<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ProductVariantOption extends Model implements HasMedia
{
    use SoftDeletes, InteractsWithMedia;

    protected $fillable = ['group_id', 'value', 'sort_order'];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('image')->singleFile();
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ProductVariantGroup::class, 'group_id');
    }

    public function variants(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductVariant::class,
            'product_variant_option_assignments',
            'option_id',
            'product_variant_id'
        );
    }
}
