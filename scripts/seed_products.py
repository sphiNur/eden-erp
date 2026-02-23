import asyncio
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app import models
from app.database import engine, AsyncSessionLocal


DATA = {
    "Meat, Fats & Eggs": {
        "names": {"en": "Meat, Fats & Eggs", "uz": "Go'sht, Yog'lar va Tuxum", "cn": "肉类、油脂与蛋类", "ru": "Мясо, Жиры и Яйца"},
        "items": [
            {"names": {"uz": "Bo'yin go'sht", "en": "Beef Neck", "cn": "牛颈肉", "ru": "Шея говяжья"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Kontir file", "en": "Sirloin/Flank", "cn": "牛腩/胸口肉", "ru": "Контр-филе"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Mol Son", "en": "Beef Leg", "cn": "后腿牛肉", "ru": "Говяжий задок"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Virezka", "en": "Beef Tenderloin", "cn": "里脊肉", "ru": "Вырезка говяжья"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Laxm go'sht", "en": "Boneless Beef", "cn": "净牛肉/瘦肉", "ru": "Мякоть говядины"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Tovuq file", "en": "Chicken Fillet", "cn": "鸡胸肉", "ru": "Куриное филе"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Tovuq qanoti", "en": "Chicken Wings", "cn": "鸡翅", "ru": "Куриные крылышки"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Tovuq oyog'i", "en": "Chicken Drumstick", "cn": "鸡腿", "ru": "Куриная ножка"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Qiyma (Farsh)", "en": "Minced Meat", "cn": "肉馅", "ru": "Фарш"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Qazi", "en": "Horse Meat Sausage", "cn": "马肉肠", "ru": "Казы"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Kalbasa", "en": "Sausage", "cn": "香肠", "ru": "Колбаса"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Sasiska", "en": "Small Sausages", "cn": "小香肠", "ru": "Сосиски"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Indeyka", "en": "Turkey", "cn": "火鸡肉", "ru": "Индейка"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Semichka lenta", "en": "Lamb Ribs", "cn": "带肉羊肋排", "ru": "Бараньи ребрышки"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Dumba", "en": "Sheep Tail Fat", "cn": "羊尾油", "ru": "Курдюк"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Charvi", "en": "Animal Fat/Suet", "cn": "羊油/板油", "ru": "Жир"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Suyak", "en": "Bones", "cn": "骨头", "ru": "Кости"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Tuxum", "en": "Eggs", "cn": "鸡蛋", "ru": "Яйца"}, "unit": {"en": "pcs", "ru": "шт", "cn": "个"}},
        ]
    },
    "Vegetables & Spices": {
        "names": {"en": "Vegetables & Spices", "uz": "Sabzavotlar va Ziravorlar", "cn": "蔬菜与调味品", "ru": "Овощи и Специи"},
        "items": [
            {"names": {"uz": "Pomidor", "en": "Tomato", "cn": "西红柿", "ru": "Помидор"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Bodring", "en": "Cucumber", "cn": "黄瓜", "ru": "Огурец"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Kartoshka", "en": "Potato", "cn": "土豆", "ru": "Картофель"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Piyoz", "en": "Onion", "cn": "洋葱", "ru": "Лук"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Qizil piyoz", "en": "Red Onion", "cn": "红洋葱", "ru": "Красный лук"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Sariq sabzi", "en": "Yellow Carrot", "cn": "黄萝卜", "ru": "Желтая морковь"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Qizil sabzi", "en": "Red Carrot", "cn": "红萝卜", "ru": "Красная морковь"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Qizil bolgarskiy", "en": "Red Bell Pepper", "cn": "红彩椒", "ru": "Красный болгарский перец"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Ko'k bolgarskiy", "en": "Green Bell Pepper", "cn": "青彩椒", "ru": "Зеленый болгарский перец"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Dunganskiy", "en": "Dungan Pepper", "cn": "东干椒", "ru": "Дунганский перец"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Aysberg", "en": "Iceberg Lettuce", "cn": "冰山生菜", "ru": "Айсберг"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Latuk", "en": "Lettuce", "cn": "生菜", "ru": "Латук"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Lolo roso", "en": "Lollo Rossa", "cn": "罗莎红生菜", "ru": "Лолло росса"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Rukola", "en": "Arugula", "cn": "芝麻菜", "ru": "Руккола"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Basay (Karom)", "en": "Chinese Cabbage", "cn": "大白菜", "ru": "Пекинская капуста"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Baqlajon", "en": "Eggplant", "cn": "茄子", "ru": "Баклажан"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Chesnok", "en": "Garlic", "cn": "大蒜", "ru": "Чеснок"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Shanpinyon", "en": "Mushroom", "cn": "蘑菇/口蘑", "ru": "Шампиньоны"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Zira", "en": "Cumin", "cn": "孜然", "ru": "Зира"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Tomat pasta", "en": "Tomato Paste", "cn": "番茄膏", "ru": "Томатная паста"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Mayonez", "en": "Mayonnaise", "cn": "蛋黄酱", "ru": "Майонез"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
        ]
    },
    "Dairy, Dough & Grains": {
        "names": {"en": "Dairy, Dough & Grains", "uz": "Sut mahsulotlari, Xamir ovqatlar va Donli mahsulotlar", "cn": "奶制品、面食与主食", "ru": "Молочные продукты, Тесто и Крупы"},
        "items": [
            {"names": {"uz": "Suzma", "en": "Strained Yogurt", "cn": "浓缩酸奶/苏兹玛", "ru": "Сузма"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Sut", "en": "Milk", "cn": "牛奶", "ru": "Молоко"}, "unit": {"en": "L", "ru": "л", "cn": "L"}},
            {"names": {"uz": "Slivka", "en": "Cream", "cn": "奶油", "ru": "Сливки"}, "unit": {"en": "L", "ru": "л", "cn": "L"}},
            {"names": {"uz": "Sir (Parmezan/Cheddar)", "en": "Cheese", "cn": "奶酪", "ru": "Сыр"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Tvorog", "en": "Cottage Cheese", "cn": "奶渣", "ru": "Творог"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Lag'mon xamir", "en": "Laghman Noodles", "cn": "拉面面团", "ru": "Тесто для лагмана"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Norin xamir", "en": "Norin Noodles", "cn": "那仁面面团", "ru": "Тесто для нарына"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Mampar xamir", "en": "Mampar Dough", "cn": "面片汤面团", "ru": "Тесто для мампар"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Lavash xamir", "en": "Lavash Bread", "cn": "卷饼面皮", "ru": "Тесто для лаваша"}, "unit": {"en": "pc", "ru": "шт", "cn": "个"}},
            {"names": {"uz": "Non (Tandir/Buxanka)", "en": "Bread/Naan", "cn": "面包/馕", "ru": "Хлеб/Лепешка"}, "unit": {"en": "pc", "ru": "шт", "cn": "个"}},
            {"names": {"uz": "Guruch", "en": "Rice", "cn": "大米", "ru": "Рис"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Makaron", "en": "Pasta", "cn": "通心粉/意面", "ru": "Макароны"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
        ]
    },
    "Fruits & Drinks": {
        "names": {"en": "Fruits & Drinks", "uz": "Mevalar va Ichimliklar", "cn": "水果与饮品", "ru": "Фрукты и Напитки"},
        "items": [
            {"names": {"uz": "Limon", "en": "Lemon", "cn": "柠檬", "ru": "Лимон"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Banan", "en": "Banana", "cn": "香蕉", "ru": "Банан"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Apelsin", "en": "Orange", "cn": "橙子", "ru": "Апельсин"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Mandarin", "en": "Tangerine", "cn": "橘子", "ru": "Мандарин"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Olma", "en": "Apple", "cn": "苹果", "ru": "Яблоко"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Kivi", "en": "Kiwi", "cn": "奇异果", "ru": "Киви"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Qora choy", "en": "Black Tea", "cn": "红茶", "ru": "Черный чай"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
            {"names": {"uz": "Kuk choy", "en": "Green Tea", "cn": "绿茶", "ru": "Зеленый чай"}, "unit": {"en": "kg", "ru": "кг", "cn": "kg"}},
        ]
    },
    "Cleaning & Household": {
        "names": {"en": "Cleaning & Household", "uz": "Tozalash va Ro'zg'or buyumlari", "cn": "清洁、日用品与耗材", "ru": "Чистящие и Хозтовары"},
        "items": [
            {"names": {"uz": "Qora perchatka", "en": "Black Gloves", "cn": "黑色手套", "ru": "Черные перчатки"}, "unit": {"en": "pair", "ru": "пара", "cn": "双"}},
            {"names": {"uz": "Gel (Idish yuvish)", "en": "Dish Soap", "cn": "洗洁精", "ru": "Гель для посуды"}, "unit": {"en": "pc", "ru": "шт", "cn": "瓶"}},
            {"names": {"uz": "Azelit", "en": "Azelit Cleaner", "cn": "Azelit清洁剂", "ru": "Азелит"}, "unit": {"en": "pc", "ru": "шт", "cn": "瓶"}},
            {"names": {"uz": "Gupka", "en": "Sponge", "cn": "海绵擦", "ru": "Губка"}, "unit": {"en": "pc", "ru": "шт", "cn": "个"}},
            {"names": {"uz": "Musir paket", "en": "Garbage Bags", "cn": "垃圾袋", "ru": "Мусорные пакеты"}, "unit": {"en": "roll", "ru": "рулон", "cn": "卷"}},
            {"names": {"uz": "Salfetka", "en": "Napkins", "cn": "餐巾纸", "ru": "Салфетки"}, "unit": {"en": "pack", "ru": "уп", "cn": "包"}},
            {"names": {"uz": "Strech", "en": "Cling Film", "cn": "保鲜膜", "ru": "Стрейч-пленка"}, "unit": {"en": "roll", "ru": "рулон", "cn": "卷"}},
            {"names": {"uz": "Falga", "en": "Aluminum Foil", "cn": "铝箔纸", "ru": "Фольга"}, "unit": {"en": "roll", "ru": "рулон", "cn": "卷"}},
            {"names": {"uz": "Saboy idish", "en": "Takeaway Containers", "cn": "打包盒", "ru": "Контейнеры для еды"}, "unit": {"en": "pc", "ru": "шт", "cn": "个"}},
            {"names": {"uz": "Pol latta", "en": "Floor Cloth", "cn": "地板抹布", "ru": "Половая тряпка"}, "unit": {"en": "pc", "ru": "шт", "cn": "个"}},
        ]
    }
}


async def seed_products():
    # Engine is already configured in app.database based on env vars
    
    async with AsyncSessionLocal() as session:
        print("--- Seeding Stores ---")
        STORES = [
            {"id": "0a853e43-fe35-4a2e-a68e-4cae40372f9c", "name": "Magic Store"},
            {"id": "11111111-1111-1111-1111-111111111111", "name": "Seoul Store"}
        ]
        
        for s_data in STORES:
            stmt = select(models.Store).where(models.Store.id == s_data['id'])
            result = await session.execute(stmt)
            store = result.scalars().first()
            if not store:
                store = models.Store(id=uuid.UUID(s_data['id']), name=s_data['name'])
                session.add(store)
                print(f"Created Store: {s_data['name']}")
        
        # Ensure Default User exists (for default foreign keys if needed)
        stmt = select(models.User).where(models.User.telegram_id == 123456789)
        result = await session.execute(stmt)
        user = result.scalars().first()
        if not user:
            user = models.User(telegram_id=123456789, role=models.UserRole.STORE_MANAGER)
            session.add(user)
            print("Created Default User")

        await session.flush()

        print("--- Seeding Product Catalog ---")

        for cat_key, data in DATA.items():
            cat_names = data["names"]
            items = data["items"]
            
            # Create/Get Category
            stmt = select(models.Category).where(models.Category.name_i18n['en'].astext == cat_names['en'])
            result = await session.execute(stmt)
            category = result.scalars().first()

            if not category:
                category = models.Category(
                    name_i18n=cat_names,
                    is_active=True
                )
                session.add(category)
                await session.flush()
                print(f"Created Category: {cat_names['en']}")
            else:
                # Update names (e.g. Meat & Fats -> Meat, Fats & Eggs)
                category.name_i18n = cat_names
                session.add(category)
                print(f"Found/Updated Category: {cat_names['en']}")

            # Create/Update Products
            for item in items:
                # Check exist
                p_stmt = select(models.Product).where(models.Product.name_i18n['en'].astext == item['names']['en'])
                p_result = await session.execute(p_stmt)
                product = p_result.scalars().first()

                if not product:
                    product = models.Product(
                        category_id=category.id,
                        name_i18n=item['names'],
                        unit_i18n=item['unit'],
                        is_active=True
                    )
                    session.add(product)
                    print(f"  + Added: {item['names']['en']}")
                else:
                    # Update category if needed
                    if product.category_id != category.id:
                        product.category_id = category.id
                        print(f"  ~ Moved: {item['names']['en']} to {cat_names['en']}")
                    
                    product.name_i18n = item['names'] # Update translations
                    product.unit_i18n = item['unit'] # Update units
                    session.add(product)
                    print(f"  . Updated: {item['names']['en']}")
        
        await session.commit()
        print("--- Seeding Complete ---")

if __name__ == "__main__":
    asyncio.run(seed_products())
