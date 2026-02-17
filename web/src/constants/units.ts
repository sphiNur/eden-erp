export const PRODUCT_UNITS = [
    { value: 'kg', label_cn: '公斤', label_ru: 'кг', label_en: 'kg' },
    { value: 'pc', label_cn: '个', label_ru: 'шт', label_en: 'pc' },
    { value: 'box', label_cn: '包', label_ru: 'уп', label_en: 'box' },
] as const;

export type ProductUnit = typeof PRODUCT_UNITS[number]['value'];

export const getUnitLabel = (unit: string, lang: 'cn' | 'ru' | 'en' = 'ru') => {
    const found = PRODUCT_UNITS.find(u => u.value === unit);
    if (!found) return unit;
    return found[`label_${lang}`];
};
