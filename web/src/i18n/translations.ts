/**
 * Centralized UI string translations for Eden Core ERP.
 * 
 * Product/category names use JSONB i18n from the backend.
 * These translations are for static UI labels, buttons, and messages.
 */

import { I18nString } from '../types';

export type TranslationKey = keyof typeof translations;

const translations = {
    // --- Common ---
    search: { en: 'Search...', ru: 'Поиск...', uz: 'Qidirish...', cn: '搜索...' },
    name: { en: 'Name', ru: 'Название', uz: 'Nomi', cn: '名称' },
    loading: { en: 'Loading...', ru: 'Загрузка...', uz: 'Yuklanmoqda...', cn: '加载中...' },
    save: { en: 'Save', ru: 'Сохранить', uz: 'Saqlash', cn: '保存' },
    cancel: { en: 'Cancel', ru: 'Отмена', uz: 'Bekor qilish', cn: '取消' },
    edit: { en: 'Edit', ru: 'Редактировать', uz: 'Tahrirlash', cn: '编辑' },
    delete: { en: 'Delete', ru: 'Удалить', uz: 'O\'chirish', cn: '删除' },
    done: { en: 'Done', ru: 'Готово', uz: 'Bajarildi', cn: '完成' },
    all: { en: 'All', ru: 'Все', uz: 'Hammasi', cn: '全部' },
    other: { en: 'Other', ru: 'Другое', uz: 'Boshqa', cn: '其他' },
    noProductsFound: { en: 'No products found.', ru: 'Товары не найдены.', uz: 'Mahsulotlar topilmadi.', cn: '未找到商品。' },
    errorGeneric: { en: 'An error occurred', ru: 'Произошла ошибка', uz: 'Xatolik yuz berdi', cn: '发生错误' },
    authenticating: { en: 'Authenticating...', ru: 'Авторизация...', uz: 'Autentifikatsiya...', cn: '认证中...' },
    accessDenied: { en: 'Access Denied', ru: 'Доступ запрещён', uz: 'Ruxsat berilmagan', cn: '拒绝访问' },
    accessDeniedMsg: { en: 'Could not verify your identity. Please contact support.', ru: 'Не удалось подтвердить вашу личность.', uz: 'Shaxsingiz tasdiqlanmadi.', cn: '无法验证您的身份，请联系支持。' },
    noResults: { en: 'No results found', ru: 'Ничего не найдено', uz: 'Hech narsa topilmadi', cn: '未找到结果' },

    // --- StoreRequest ---
    storeRequest: { en: 'Store Request', ru: 'Заявка магазина', uz: 'Do\'kon buyurtmasi', cn: '门店需求' },
    selectedItems: { en: 'Selected Items', ru: 'Выбранные товары', uz: 'Tanlangan mahsulotlar', cn: '已选商品' },
    cartEmpty: { en: 'Cart is empty', ru: 'Корзина пуста', uz: 'Savat bo\'sh', cn: '购物车为空' },
    confirmSubmit: { en: 'Confirm & Submit', ru: 'Подтвердить', uz: 'Tasdiqlash', cn: '确认提交' },
    orderSubmitted: { en: 'Order Submitted Successfully!', ru: 'Заказ отправлен!', uz: 'Buyurtma yuborildi!', cn: '订单已成功提交！' },
    orderFailed: { en: 'Failed to submit order', ru: 'Ошибка отправки заказа', uz: 'Buyurtma yuborilmadi', cn: '提交订单失败' },
    cartIsEmpty: { en: 'Cart is empty!', ru: 'Корзина пуста!', uz: 'Savat bo\'sh!', cn: '购物车为空！' },
    failedLoadProducts: { en: 'Failed to load products', ru: 'Не удалось загрузить товары', uz: 'Mahsulotlarni yuklab bo\'lmadi', cn: '加载商品失败' },
    dailyRequest: { en: 'Daily Request', ru: 'Ежедневная заявка', uz: 'Kunlik buyurtma', cn: '每日需求' },

    // --- MarketRun ---
    marketRun: { en: 'Market Run', ru: 'Закупка', uz: 'Bozor xaridi', cn: '市场采购' },
    qty: { en: 'Qty', ru: 'Кол-во', uz: 'Soni', cn: '数量' },
    unitPrice: {
        en: 'Unit Price',
        ru: 'Цена за ед.',
        uz: 'Birlik narxi',
        cn: '单价'
    },
    totalCost: { en: 'Total Cost', ru: 'Общая стоимость', uz: 'Umumiy narx', cn: '总费用' },
    noItemsFound: { en: 'No Items Found', ru: 'Товары не найдены', uz: 'Mahsulotlar topilmadi', cn: '未找到商品' },
    finalizeBatch: { en: 'Finalize Batch', ru: 'Завершить закупку', uz: 'Xaridni yakunlash', cn: '完成批次' },
    failedLoadItems: { en: 'Failed to load items', ru: 'Не удалось загрузить', uz: 'Yuklab bo\'lmadi', cn: '加载失败' },
    noItemsBought: { en: 'No items marked as bought!', ru: 'Нет отмеченных товаров!', uz: 'Sotib olingan mahsulot yo\'q!', cn: '没有标记为已购的商品！' },
    batchFinalized: { en: 'Purchase Batch Finalized!', ru: 'Закупка завершена!', uz: 'Xarid yakunlandi!', cn: '采购批次已完成！' },
    batchError: { en: 'Error finalizing batch', ru: 'Ошибка при завершении', uz: 'Yakunlashda xatolik', cn: '完成批次失败' },
    enterValidCost: { en: 'Please enter valid total cost for', ru: 'Введите стоимость для', uz: 'Narxni kiriting:', cn: '请输入有效总费用：' },
    enterValidQty: { en: 'Please enter valid quantity for', ru: 'Введите количество для', uz: 'Sonini kiriting:', cn: '请输入有效数量：' },

    // --- Admin ---
    inventory: { en: 'Inventory', ru: 'Инвентарь', uz: 'Inventar', cn: '库存' },
    itemsFound: { en: 'Items found', ru: 'Товаров найдено', uz: 'Mahsulotlar topildi', cn: '件商品' },
    searchProducts: { en: 'Search products...', ru: 'Поиск товаров...', uz: 'Mahsulotlarni qidirish...', cn: '搜索商品...' },
    teamManagement: { en: 'Team Management', ru: 'Управление командой', uz: 'Jamoani boshqarish', cn: '团队管理' },
    users: { en: 'Users', ru: 'Пользователи', uz: 'Foydalanuvchilar', cn: '用户' },
    editUser: { en: 'Edit User', ru: 'Редактировать', uz: 'Tahrirlash', cn: '编辑用户' },
    role: { en: 'Role', ru: 'Роль', uz: 'Rol', cn: '角色' },
    assignedStore: { en: 'Assigned Store', ru: 'Назначенный магазин', uz: 'Tayinlangan do\'kon', cn: '分配门店' },
    selectStore: { en: 'Select Store...', ru: 'Выберите магазин...', uz: 'Do\'konni tanlang...', cn: '选择门店...' },
    saveChanges: { en: 'Save Changes', ru: 'Сохранить', uz: 'Saqlash', cn: '保存更改' },
    stores: { en: 'Stores', ru: 'Магазины', uz: 'Do\'konlar', cn: '门店' },
    locations: { en: 'Locations', ru: 'Локации', uz: 'Manzillar', cn: '位置' },
    addStore: { en: 'Add Store', ru: 'Добавить', uz: 'Qo\'shish', cn: '添加门店' },
    noAddress: { en: 'No address', ru: 'Нет адреса', uz: 'Manzil yo\'q', cn: '无地址' },
    active: { en: 'Active', ru: 'Активен', uz: 'Faol', cn: '活跃' },
    updateFailed: { en: 'Failed to update user', ru: 'Ошибка обновления', uz: 'Yangilab bo\'lmadi', cn: '更新用户失败' },

    // --- ProductForm ---
    saveFailed: { en: 'Failed to save', ru: 'Ошибка сохранения', uz: 'Saqlab bo\'lmadi', cn: '保存失败' },
    editProduct: { en: 'Edit Product', ru: 'Редактировать товар', uz: 'Mahsulotni tahrirlash', cn: '编辑商品' },
    addProduct: { en: 'Add Product', ru: 'Добавить товар', uz: 'Mahsulot qo\'shish', cn: '添加商品' },
    category: { en: 'Category', ru: 'Категория', uz: 'Kategoriya', cn: '分类' },
    select: { en: 'Select...', ru: 'Выбрать...', uz: 'Tanlash...', cn: '选择...' },
    unit: { en: 'Unit', ru: 'Единица', uz: 'Birlik', cn: '单位' },
    referencePrice: { en: 'Ref. Price', ru: 'Ориент. цена', uz: 'Narx', cn: '参考价' },
    update: { en: 'Update', ru: 'Обновить', uz: 'Yangilash', cn: '更新' },
    basicInfo: { en: 'Basic Info', ru: 'Основная инфо', uz: 'Asosiy ma\'lumot', cn: '基本信息' },
    translations: { en: 'Translations', ru: 'Переводы', uz: 'Tarjimalar', cn: '多语言名称' },
    analytics: { en: 'Analytics', ru: 'Аналитика', uz: 'Tahlillar', cn: '数据分析' },

    // --- Shared ---
    retry: { en: 'Retry', ru: 'Повторить', uz: 'Qayta urinish', cn: '重试' },
    errorOccurred: { en: 'Something went wrong', ru: 'Что-то пошло не так', uz: 'Xatolik yuz berdi', cn: '出现错误' },
    estimatedTotal: { en: 'Est. Total', ru: 'Ориент. итого', uz: 'Taxminiy jami', cn: '预估合计' },
    progress: { en: 'Progress', ru: 'Прогресс', uz: 'Jarayon', cn: '进度' },
    items: { en: 'items', ru: 'товаров', uz: 'mahsulot', cn: '件商品' },
} satisfies Record<string, I18nString>;

export default translations;
