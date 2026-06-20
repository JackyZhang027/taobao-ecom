<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Faq extends Model
{
    protected $fillable = [
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(FaqTranslation::class);
    }

    public function getQuestionAttribute(): string
    {
        $locale = app()->getLocale();
        $translation = $this->translations->firstWhere('locale', $locale)
            ?? $this->translations->firstWhere('locale', 'en');

        return $translation?->question ?? '';
    }

    public function getAnswerAttribute(): ?string
    {
        $locale = app()->getLocale();
        $translation = $this->translations->firstWhere('locale', $locale)
            ?? $this->translations->firstWhere('locale', 'en');

        return $translation?->answer;
    }
}
