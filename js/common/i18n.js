const LANGUAGE_KEY = "sakaInterfaceLanguage";
const DEFAULT_LANGUAGE = "ru";
const LANGUAGES = ["ru", "en"];
const originalTextNodes = new WeakMap();
const originalAttributes = new WeakMap();

const MESSAGES = {
  "account.avatarSaved": "Аватар сохранен",
  "account.avatarSaveFailed": "Не удалось сохранить аватар. Попробуйте позже.",
  "account.chooseImage": "Выберите изображение",
  "account.dataSaved": "Данные сохранены",
  "account.defaultValue": "Не указано",
  "account.imageProcessFailed": "Не удалось обработать изображение",
  "account.imageTooLarge": "Изображение слишком большое",
  "account.invalidEmail": "Введите корректный E-mail",
  "account.invalidFullName": "Введите фамилию и имя",
  "account.invalidPhone": "Введите белорусский номер телефона",
  "account.ordersAdmin": "Все заказы",
  "account.ordersUser": "Ваши заказы",
  "account.saveFailed": "Не удалось сохранить данные",
  "account.saveFailedLong": "Не удалось сохранить данные. Попробуйте позже.",
  "account.settingsReset": "Настройки сброшены",
  "admin.added": "Товар добавлен",
  "admin.chooseDelete": "Выберите товар для удаления",
  "admin.chooseEdit": "Выберите товар для редактирования",
  "admin.confirmDelete": "Удалить товар \"{title}\"?",
  "admin.deleted": "Товар удален",
  "admin.deleteFailed": "Не удалось удалить товар",
  "admin.noProducts": "Товары не найдены",
  "admin.saveFailed": "Не удалось сохранить товар",
  "admin.updated": "Товар обновлен",
  "auth.agreementRequired": "Подтвердите соглашение",
  "auth.emailExists": "Такой E-mail уже зарегистрирован",
  "auth.invalidEmail": "Введите корректный E-mail",
  "auth.invalidFirstName": "Введите имя",
  "auth.invalidLastName": "Введите фамилию",
  "auth.invalidMiddleName": "Введите корректное отчество",
  "auth.invalidPassword": "Пароль 8-20 символов: буквы, цифра и спецсимвол",
  "auth.invalidPhone": "Введите белорусский номер телефона",
  "auth.loginFailed": "Не удалось выполнить вход. Попробуйте позже.",
  "auth.nicknameExists": "Такой никнейм уже существует",
  "auth.nicknameRequired": "Сгенерируйте никнейм",
  "auth.notFound": "Пользователь не найден",
  "auth.passwordMismatch": "Пароли должны совпадать",
  "auth.phoneExists": "Такой телефон уже зарегистрирован",
  "auth.registerFailed": "Не удалось зарегистрироваться",
  "auth.registerFailedLong": "Не удалось зарегистрироваться. Попробуйте позже.",
  "auth.registerSuccess": "Регистрация прошла успешно",
  "auth.tooYoung": "Регистрация доступна с 16 лет",
  "auth.wrongPassword": "Неверный пароль",
  "cart.checkout": "Оформить заказ",
  "cart.close": "Закрыть корзину",
  "cart.colorMissing": "Цвет не указан",
  "cart.empty": "Корзина пуста",
  "cart.inProgress": "Оформляем заказ...",
  "cart.loadFailed": "Не удалось загрузить корзину",
  "cart.orderFailed": "Не удалось оформить заказ. Попробуйте позже.",
  "cart.orderSuccess": "Заказ успешно оформлен",
  "cart.remove": "Удалить",
  "cart.removeAria": "Удалить товар",
  "cart.title": "Корзина",
  "cart.total": "Итого",
  "cart.updateFailed": "Не удалось обновить корзину",
  "cart.widthMissing": "Ширина не указана",
  "common.close": "Закрыть",
  "common.kg": "кг",
  "common.requestFailed": "Не удалось отправить заявку. Попробуйте позже.",
  "common.requestSuccess": "Заявка успешно отправлена",
  "common.submitRequired": "Заполните обязательные поля",
  "catalog.allColors": "Все цвета",
  "catalog.loadFailed": "Не удалось загрузить товары",
  "catalog.more": "Подробнее",
  "home.requestSource": "Главная страница",
  "orders.admin": "Администратор",
  "orders.allOrders": "Все заказы",
  "orders.customer": "Покупатель",
  "orders.delete": "Удалить",
  "orders.itemMany": "{count} товаров",
  "orders.itemOne": "{count} товар",
  "orders.itemFew": "{count} товара",
  "orders.noDate": "Не указана",
  "orders.noItems": "Товары не указаны",
  "orders.notFoundUser": "Пользователь не найден",
  "orders.userOrders": "Ваши заказы",
  "notFound.documentTitle": "404 — Страница не найдена | Saka Tekstil",
  "notFound.kicker": "Ошибка 404",
  "notFound.title": "Страница не найдена",
  "notFound.description": "Возможно, страница была перемещена или адрес указан неверно. Вернитесь на главную страницу или перейдите в каталог тканей.",
  "notFound.home": "На главную",
  "notFound.catalog": "Перейти в каталог",
  "notFound.copyright": "© 2023 Сака Текстиль. Все права защищены.",
  "price.address": "Адрес",
  "price.agree": "Нажимая на кнопку вы даете свое согласие на обработку персональных данных. Гарантируем! Спама не будет!",
  "price.lead": "Оставьте заявку и получите образцы",
  "price.name": "Имя",
  "price.source": "Прайс-лист и каталог",
  "price.submit": "Оставить заявку",
  "price.title": "Заказать прайс-лист и каталог",
  "product.added": "Товар добавлен в корзину",
  "product.addFailed": "Не удалось добавить товар в корзину",
  "product.notFound": "Товар не найден",
  "product.pageRequestSource": "Страница товара",
  "product.production": "Турция",
  "reviews.saveFailed": "Не удалось сохранить отзыв. Попробуйте еще раз.",
  "validation.address": "Введите адрес",
  "validation.email": "Введите корректный E-mail",
  "validation.name": "Введите имя",
  "validation.phone": "Введите белорусский номер телефона",
};

const EN_MESSAGES = {
  "account.avatarSaved": "Avatar has been saved",
  "account.avatarSaveFailed": "Could not save the avatar. Please try again later.",
  "account.chooseImage": "Choose an image",
  "account.dataSaved": "Data has been saved",
  "account.defaultValue": "Not specified",
  "account.imageProcessFailed": "Could not process the image",
  "account.imageTooLarge": "The image is too large",
  "account.invalidEmail": "Enter a valid E-mail",
  "account.invalidFullName": "Enter last name and first name",
  "account.invalidPhone": "Enter a Belarusian phone number",
  "account.ordersAdmin": "All orders",
  "account.ordersUser": "Your orders",
  "account.saveFailed": "Could not save data",
  "account.saveFailedLong": "Could not save data. Please try again later.",
  "account.settingsReset": "Settings have been reset",
  "admin.added": "Product has been added",
  "admin.chooseDelete": "Choose a product to delete",
  "admin.chooseEdit": "Choose a product to edit",
  "admin.confirmDelete": "Delete product \"{title}\"?",
  "admin.deleted": "Product has been deleted",
  "admin.deleteFailed": "Could not delete product",
  "admin.noProducts": "Products not found",
  "admin.saveFailed": "Could not save product",
  "admin.updated": "Product has been updated",
  "auth.agreementRequired": "Confirm the agreement",
  "auth.emailExists": "This E-mail is already registered",
  "auth.invalidEmail": "Enter a valid E-mail",
  "auth.invalidFirstName": "Enter first name",
  "auth.invalidLastName": "Enter last name",
  "auth.invalidMiddleName": "Enter a valid middle name",
  "auth.invalidPassword": "Password must be 8-20 characters: letters, a digit, and a special character",
  "auth.invalidPhone": "Enter a Belarusian phone number",
  "auth.loginFailed": "Could not sign in. Please try again later.",
  "auth.nicknameExists": "This nickname already exists",
  "auth.nicknameRequired": "Generate a nickname",
  "auth.notFound": "User not found",
  "auth.passwordMismatch": "Passwords must match",
  "auth.phoneExists": "This phone number is already registered",
  "auth.registerFailed": "Could not register",
  "auth.registerFailedLong": "Could not register. Please try again later.",
  "auth.registerSuccess": "Registration completed successfully",
  "auth.tooYoung": "Registration is available from age 16",
  "auth.wrongPassword": "Incorrect password",
  "cart.checkout": "Checkout",
  "cart.close": "Close cart",
  "cart.colorMissing": "Color not specified",
  "cart.empty": "Cart is empty",
  "cart.inProgress": "Placing order...",
  "cart.loadFailed": "Could not load cart",
  "cart.orderFailed": "Could not place the order. Please try again later.",
  "cart.orderSuccess": "Order has been placed",
  "cart.remove": "Remove",
  "cart.removeAria": "Remove product",
  "cart.title": "Cart",
  "cart.total": "Total",
  "cart.updateFailed": "Could not update cart",
  "cart.widthMissing": "Width not specified",
  "common.close": "Close",
  "common.kg": "kg",
  "common.requestFailed": "Could not send request. Please try again later.",
  "common.requestSuccess": "Request has been sent",
  "common.submitRequired": "Fill in the required fields",
  "catalog.allColors": "All colors",
  "catalog.loadFailed": "Could not load products",
  "catalog.more": "Details",
  "home.requestSource": "Home page",
  "orders.admin": "Administrator",
  "orders.allOrders": "All orders",
  "orders.customer": "Customer",
  "orders.delete": "Delete",
  "orders.itemMany": "{count} items",
  "orders.itemOne": "{count} item",
  "orders.itemFew": "{count} items",
  "orders.noDate": "Not specified",
  "orders.noItems": "No products specified",
  "orders.notFoundUser": "User not found",
  "orders.userOrders": "Your orders",
  "notFound.documentTitle": "404 — Page not found | Saka Tekstil",
  "notFound.kicker": "Error 404",
  "notFound.title": "Page not found",
  "notFound.description": "The page may have been moved or the address may be incorrect. Return to the home page or browse the fabric catalog.",
  "notFound.home": "Go home",
  "notFound.catalog": "Browse catalog",
  "notFound.copyright": "© 2023 Saka Tekstil. All rights reserved.",
  "price.address": "Address",
  "price.agree": "By clicking the button, you consent to personal data processing. We guarantee no spam.",
  "price.lead": "Send a request and get samples",
  "price.name": "Name",
  "price.source": "Price list and catalog",
  "price.submit": "Send request",
  "price.title": "Request a price list and catalog",
  "product.added": "Product has been added to cart",
  "product.addFailed": "Could not add product to cart",
  "product.notFound": "Product not found",
  "product.pageRequestSource": "Product page",
  "product.production": "Turkey",
  "reviews.saveFailed": "Could not save the review. Please try again.",
  "validation.address": "Enter address",
  "validation.email": "Enter a valid E-mail",
  "validation.name": "Enter name",
  "validation.phone": "Enter a Belarusian phone number",
};

const TEXT = {
  ...MESSAGES,
  "Saka Holding": "Saka Holding",
  "Saka Tekstil": "Saka Tekstil",
  "Производитель турецкого трикотажного полотна": "Turkish knit fabric manufacturer",
  "Партнерские логотипы": "Partner logos",
  "Поиск": "Search",
  "Найти": "Search",
  "Корзина": "Cart",
  "Войти": "Sign in",
  "Выйти": "Sign out",
  "Главная": "Home",
  "Каталог": "Catalog",
  "О компании": "About",
  "Доставка и оплата": "Delivery and payment",
  "Контакты": "Contacts",
  "Акции": "Sale",
  "АКЦИИ": "SALE",
  "Кулинарная гладь": "Cotton jersey",
  "Футер": "French terry",
  "Кашкорсе, рибана": "Kashkorse, rib knit",
  "Пике": "Pique",
  "Интерлок": "Interlock",
  "Капитоний": "Capiton",
  "Версия для слабовидящих": "Accessibility version",
  "Открыть меню": "Open menu",
  "Закрыть меню": "Close menu",
  "Основная навигация": "Main navigation",
  "Мобильная навигация": "Mobile navigation",
  "Навигация в подвале": "Footer navigation",
  "Навигация": "Navigation",
  "Напишите нам,": "Message us,",
  "мы онлайн:": "we are online:",
  "Copyright © 2023 Сака Текстиль. Все права защищены.": "Copyright © 2023 Saka Tekstil. All rights reserved.",
  "Сака Текстиль. Все права защищены.": "Saka Tekstil. All rights reserved.",
  "Ткани для вашего бизнеса": "Fabrics for your business",
  "Большой выбор качественных тканей для производства и пошива одежды": "A wide choice of quality fabrics for apparel production and tailoring",
  "Лёгкие ткани для стильных и воздушных коллекций": "Light fabrics for stylish, airy collections",
  "Качественные полотна для летней и повседневной одежды": "Quality fabrics for summer and everyday clothing",
  "Пастельная палитра тканей для уютных изделий": "A pastel fabric palette for cozy garments",
  "Подберите ткань под цвет и стиль вашего бренда": "Choose fabric for your brand color and style",
  "Мягкие оттенки для современных коллекций одежды": "Soft shades for modern clothing collections",
  "Перейти в каталог": "Go to catalog",
  "Подробнее": "Details",
  "Трикотажное полотно": "Knitted fabric",
  "Выбирайте из множества разновидностей тканей": "Choose from many fabric varieties",
  "Футер 3-х Нитка": "3-thread french terry",
  "Френч Терри": "French terry",
  "Вискоза": "Viscose",
  "Бифлекс": "Biflex",
  "Saka Tekstil – для тех, кто хочет быстро": "Saka Tekstil is for those who want to quickly",
  "и комфортно получать текстильную продукцию": "and comfortably receive textile products",
  "высокого качества по адекватной стоимости": "of high quality at a fair price",
  "Предоставляем возможность закупки широкого ассортимента: футер, кулирка, джакарт, флис, рибана и многое другое…": "We offer purchasing across a wide range: french terry, cotton jersey, jacquard, fleece, rib knit, and much more...",
  "Наша компания является надежным поставщиком и производителем турецкого трикотажного полотна по всему миру": "Our company is a reliable supplier and manufacturer of Turkish knitted fabric worldwide",
  "Смотреть каталог": "View catalog",
  "Актуальная палитра “Saka Tekstil” из 45+ цветов – поможет решить любые задачи, стоящие перед вами": "The current Saka Tekstil palette of 45+ colors will help solve any task in front of you",
  "Актуальная палитра “Saka Tekstil”": "The current Saka Tekstil palette",
  "из 45+ цветов – поможет решить любые задачи, стоящие перед вами": "of 45+ colors will help solve any task in front of you",
  "Фабрика «Saka Tekstil» осуществляет прокрас текстиля на заказ на самых выгодных условиях": "The Saka Tekstil factory provides custom textile dyeing on the most favorable terms",
  "Просто оставьте заявку на сайте и мы свяжемся с вами в ближайшее время": "Just leave a request on the site and we will contact you shortly",
  "Требуется закупка ткани от 500кг?": "Need to purchase fabric from 500 kg?",
  "Оставьте заявку на сайте и мы свяжемся с вами в ближайшее время": "Leave a request on the site and we will contact you shortly",
  "Телефон вводите в формате +375 (__) ___-__-__": "Enter the phone number in the format +375 (__) ___-__-__",
  "E-mail вводите в формате example@gmail.com": "Enter E-mail in the format example@gmail.com",
  "Нам доверяют производство": "Manufacturers trust us",
  "трикотажных полотен": "with knitted fabrics",
  "Более 15 лет Saka Tekstil поставляет ткани для фабрик, брендов одежды и ателье. Мы контролируем качество сырья, окрашивания и упаковки на каждом этапе.": "For more than 15 years, Saka Tekstil has supplied fabrics for factories, clothing brands, and studios. We control the quality of raw materials, dyeing, and packaging at every stage.",
  "В каталоге представлены востребованные виды полотен: кулирная гладь, футер, рибана, кашкорсе, пике и другие материалы для массового и капсульного производства.": "The catalog includes popular fabric types: cotton jersey, french terry, rib knit, kashkorse, pique, and other materials for mass and capsule production.",
  "Оставить заявку": "Send request",
  "Все цвета": "All colors",
  "Оставьте заявку": "Send a request",
  "и наш менеджер свяжется с вами": "and our manager will contact you",
  "Ваше имя": "Your name",
  "Телефон": "Phone",
  "Ваш E-mail": "Your E-mail",
  "example@gmail.com": "example@gmail.com",
  "Отправить": "Send",
  "Нажимая на кнопку вы даете свое согласие на обработку персональных данных. Гарантируем! Спама не будет!": "By clicking the button, you consent to personal data processing. We guarantee no spam.",
  "Личные данные": "Personal data",
  "Изменить аватар": "Change avatar",
  "ФИО": "Full name",
  "Город": "City",
  "Ваши заказы": "Your orders",
  "Все заказы": "All orders",
  "Сбросить настройки": "Reset settings",
  "Регистрация": "Registration",
  "Фамилия": "Last name",
  "Имя": "First name",
  "Отчество": "Middle name",
  "Дата рождения": "Date of birth",
  "Пароль вручную": "Manual password",
  "Автоматический пароль": "Automatic password",
  "Придумать пароль": "Create a password",
  "Сгенерировать пароль": "Generate a password",
  "Пароль": "Password",
  "Повтор пароля": "Repeat password",
  "Повторите пароль": "Repeat password",
  "Никнейм": "Nickname",
  "Сгенерировать ещё": "Generate again",
  "Согласен с условиями обработки данных": "I agree to the data processing terms",
  "Я согласен с пользовательским соглашением": "I agree to the user agreement",
  "Открыть соглашение": "Open agreement",
  "Нажимая кнопку регистрации, вы соглашаетесь на обработку данных для создания аккаунта и оформления заказов Saka Tekstil.": "By clicking the registration button, you agree to data processing for creating an account and placing orders with Saka Tekstil.",
  "Зарегистрироваться": "Register",
  "Уже есть аккаунт? Войти": "Already have an account? Sign in",
  "Уже есть аккаунт": "Already have an account",
  "Email или телефон": "Email or phone",
  "E-mail или телефон": "E-mail or phone",
  "Вход": "Sign in",
  "Забыли пароль?": "Forgot password?",
  "Еще нет аккаунта? Зарегистрироваться": "No account yet? Register",
  "Хлебные крошки": "Breadcrumbs",
  "Товар": "Product",
  "Товар не найден": "Product not found",
  "Изображения товара": "Product images",
  "Цвет": "Color",
  "Добавить в корзину": "Add to cart",
  "Характеристики": "Specifications",
  "Рассчитайте стоимость ткани, ответив на три вопроса": "Calculate fabric cost by answering three questions",
  "1. Выберите необходимую ткань": "1. Choose the fabric",
  "2. Введите общее количество рулонов": "2. Enter the total number of rolls",
  "3. Введите общее количество пачек": "3. Enter the total number of packs",
  "Уменьшить количество рулонов": "Decrease rolls",
  "Увеличить количество рулонов": "Increase rolls",
  "Количество рулонов": "Number of rolls",
  "Уменьшить количество пачек": "Decrease packs",
  "Увеличить количество пачек": "Increase packs",
  "Количество пачек": "Number of packs",
  "Уменьшить количество": "Decrease quantity",
  "Увеличить количество": "Increase quantity",
  "Цена за КГ:": "Price per kg:",
  "Общая масса:": "Total weight:",
  "Общая сумма:": "Total amount:",
  "Выбранная ткань:": "Selected fabric:",
  "Итоговая стоимость:": "Final cost:",
  "/ кг": "/ kg",
  "Материал:": "Material:",
  "Качество:": "Quality:",
  "Состав:": "Composition:",
  "Состав": "Composition",
  "Цвет:": "Color:",
  "Плотность:": "Density:",
  "Ширина рулона:": "Roll width:",
  "Производство:": "Production:",
  "Доставка и оплата": "Delivery and payment",
  "Способы доставки товара": "Product delivery methods",
  "Самовывоз": "Pickup",
  "Со склада по адресу:": "From warehouse at:",
  "г. Могилев, ул. Верхние поля, д.48а, стр. 1": "Mogilev, Verkhnie Polya St., 48a, building 1",
  "График работы:": "Working hours:",
  "Доставка до транспортной компании": "Delivery to a transport company",
  "Бесплатная доставка до терминала ТК Деловые Линии, Байкал-Сервис, ПЭК, GTD, БСД, Мейджик Транс*": "Free delivery to terminals of Delovye Linii, Baikal Service, PEK, GTD, BSD, Magic Trans*",
  "Перевозка от терминала ТК до пункта назначения оплачивается по тарифам ТК": "Transportation from the terminal to the destination is paid according to the carrier rates",
  "* Действует только для крупных заказов от 5000 кг": "* Applies only to large orders from 5000 kg",
  "Доставка по Могилеву": "Delivery in Mogilev",
  "Стоимость доставки уточняйте у менеджера": "Ask the manager for delivery cost",
  "Возникли вопросы по доставке?": "Questions about delivery?",
  "Оставьте заявку и мы свяжемся с вами в ближайшее время": "Send a request and we will contact you shortly",
  "Оплата товара": "Payment",
  "Наиболее удобный для вас способ оплаты товара вы можете согласовать с менеджером": "You can agree on the most convenient payment method with the manager",
  "Безналичный расчет": "Bank transfer",
  "Безналичный расчет осуществляется для юридических лиц": "Bank transfer is available for legal entities",
  "Более подробную информацию можно уточнить по телефону": "More detailed information is available by phone",
  "Звоните сейчас:": "Call now:",
  "Или напишите нашему менеджеру напрямую:": "Or message our manager directly:",
  "Среднее время ответа": "Average response time",
  "5 минут": "5 minutes",
  "Контактная информация": "Contact information",
  "Контакты": "Contacts",
  "Адрес:": "Address:",
  "Телефон:": "Phone:",
  "Почта:": "Email:",
  "График работы:": "Working hours:",
  "г.Могилев, МКР Котельники, ул. Яничкин проезд 7": "Mogilev, Kotel'niki district, Yanichkin proezd 7",
  "ПН-ПТ 09:00-18:00": "Mon-Fri 09:00-18:00",
  "ПН-ПТ 9:30-17:00": "Mon-Fri 9:30-17:00",
  "СБ 10:00-17:00": "Sat 10:00-17:00",
  "СБ 10:30-16:00": "Sat 10:30-16:00",
  "ВС Выходной": "Sun closed",
  "Карта": "Map",
  "Карта Saka Tekstil": "Saka Tekstil map",
  "Получите консультацию": "Get a consultation",
  "Получите бесплатную консультацию от нашего специалиста": "Get a free consultation from our specialist",
  "Получите бесплатную консультацию": "Get a free consultation",
  "от нашего специалиста": "from our specialist",
  "Заполните форму ниже и мы свяжемся с вами в ближайшее время": "Fill in the form below and we will contact you shortly",
  "Оставьте контакты, и мы поможем подобрать ткань под вашу задачу": "Leave your contacts and we will help choose fabric for your task",
  "О компании": "About",
  "Здание и флаги компании Saka Tekstil": "Saka Tekstil building and company flags",
  "Saka Tekstil - производство и продажа турецкого трикотажного полотна": "Saka Tekstil - production and sale of Turkish knitted fabric",
  "Мы осуществляем продажу ткани от рулона и нарезку кашкорсе от 5%-20%.": "We sell fabric by the roll and cut kashkorse from 5%-20%.",
  "Наша команда следит за трендами, новыми материалами, и предлагает ассортимент, который позволяет брендам быстро запускать новые коллекции.": "Our team follows trends and new materials, offering a range that helps brands launch new collections quickly.",
  "Наша команда следит за трендами в мире трикотажа, мы постоянно обновляем наш ассортимент и регулярно контролируем наличие ткани на складе.": "Our team follows trends in knitwear, constantly updates the assortment, and regularly controls fabric availability in stock.",
  "Мы предлагаем клиентам различные виды трикотажных полотен высокого качества более, чем в 45 цветовых вариациях.": "We offer customers different types of high-quality knitted fabrics in more than 45 color variations.",
  "Показатели компании": "Company indicators",
  "Лет на рынке текстиля": "Years in the textile market",
  "Ассортимент товаров в наличии": "Product range in stock",
  "Клиентов выбирают нашу компанию": "Customers choose our company",
  "лет на рынке": "years on the market",
  "видов полотна": "fabric types",
  "тонн в месяц": "tons per month",
  "Качество полотна": "Fabric quality",
  "Зеленая трикотажная ткань": "Green knitted fabric",
  "Зеленый капитоний": "Green capiton fabric",
  "Бежевая рибана": "Beige rib knit",
  "Saka Tekstil работает с трикотажными полотнами разного качества:": "Saka Tekstil works with knitted fabrics of different quality:",
  "Бюджетный трикотаж для повседневных изделий и базовых коллекций.": "Budget knit fabric for everyday items and basic collections.",
  "Бюджетный трикотаж, имеет ворсистую и шероховатую поверхность из-за коротких волокон.": "Budget knit fabric with a fleecy, slightly rough surface due to short fibers.",
  "Высшее качество полотна из длинноволокнистого хлопка.": "Top-quality fabric made from long-staple cotton.",
  "Высшее качество трикотажной ткани, имеет гладкую поверхность без ворсинок.": "Top-quality knitted fabric with a smooth, lint-free surface.",
  "Полотно вяжется только из лучшего сырья без аналогов на рынке.": "The fabric is knitted only from the best raw materials with no market analogues.",
  "Полотно вяжется американскими нитями и окрашено немецкими красками высшего качества.": "The fabric is knitted with American yarns and dyed with top-quality German dyes.",
  "Пенье компакт": "Compact combed",
  "Пенье компакт Плюс-EXCLUSIVE": "Compact combed Plus-EXCLUSIVE",
  "Наша главная задача - не просто предоставить качественную ткань, но и оказать каждому заказчику высокий уровень клиентского сервиса": "Our main task is not only to provide quality fabric, but also to give every customer a high level of service",
  "Логистика": "Logistics",
  "Весь ассортимент в наличии и готов к быстрой отгрузке.": "The full range is in stock and ready for fast shipment.",
  "Весь ассортимент в наличии на складе в Москве. Вам не потребуется тратить свои ресурсы на доставку ткани из Турции.": "The full range is in stock at the Moscow warehouse, so you do not need to spend resources shipping fabric from Turkey.",
  "Производство": "Production",
  "Регулярное наличие ткани на складе позволяет планировать закупки заранее.": "Regular stock availability helps you plan purchases in advance.",
  "Регулярное наличие ткани позволяет не останавливать процесс вашего производства и минимизирует финансовые потери.": "Regular fabric availability helps keep your production running and minimizes financial losses.",
  "Дополнительные материалы": "Additional materials",
  "Вместе с товаром предоставляем сопроводительные документы и рекомендации.": "We provide supporting documents and recommendations together with the goods.",
  "Вместе с товаром мы предоставляем полиэтиленовую упаковку, бесплатную загрузку товара со склада и бесплатные образцы.": "Together with the goods, we provide polyethylene packaging, free warehouse loading, and free samples.",
  "Лояльность": "Loyalty",
  "Наш трикотаж закупают производители одежды, ателье и дизайнерские бренды.": "Our knit fabrics are purchased by clothing manufacturers, studios, and designer brands.",
  "Наш трикотаж закупают известные бренды. Это позволит вам создать собственный качественный бренд одежды.": "Well-known brands purchase our knit fabrics, helping you create your own quality clothing brand.",
  "Уникальность": "Uniqueness",
  "Мы предоставляем клиентам разные виды полотен и актуальные цвета.": "We provide customers with different fabric types and current colors.",
  "Мы предоставляем клиентам широкую палитру цветов, что позволяет создавать уникальные коллекции одежды.": "We provide customers with a wide color palette, making it possible to create unique clothing collections.",
  "Качество": "Quality",
  "Наша ткань обрабатывается по стандартам, которые помогают сохранить форму и цвет изделия.": "Our fabric is processed to standards that help preserve the garment's shape and color.",
  "Наша ткань обрабатывается специальным силиконовым составом, что позволяет ей не терять свои свойства с течением времени.": "Our fabric is treated with a special silicone composition, helping it retain its properties over time.",
  "Отзывы клиентов": "Customer reviews",
  "Делаем все для того, чтобы вы остались довольны нашей тканью": "We do everything to make sure you are satisfied with our fabric",
  "Предыдущие отзывы": "Previous reviews",
  "Следующие отзывы": "Next reviews",
  "Отзывы пока не добавлены": "No reviews yet",
  "Не удалось загрузить отзывы. Обновите страницу.": "Could not load reviews. Refresh the page.",
  "Оставить отзыв": "Leave a review",
  "Закрыть форму": "Close form",
  "Ваш отзыв": "Your review",
  "Фильтры": "Filters",
  "Позаботьтесь о себе и своих близких, выбирайте качественные ткани": "Take care of yourself and your loved ones: choose quality fabrics",
  "Категория": "Category",
  "Цвета": "Colors",
  "Сбросить": "Reset",
  "Сортировка": "Sorting",
  "Сортировка:": "Sorting:",
  "По умолчанию": "Default",
  "Цена по возрастанию": "Price ascending",
  "Цена по убыванию": "Price descending",
  "Сначала дешевле": "Cheapest first",
  "Сначала дороже": "Most expensive first",
  "Управление каталогом": "Catalog management",
  "Фильтры каталога": "Catalog filters",
  "Название товара": "Product name",
  "Тип полотна": "Fabric type",
  "Товары каталога": "Catalog products",
  "Ничего не найдено": "Nothing found",
  "Товары не найдены": "Products not found",
  "Назад": "Back",
  "Вперед": "Forward",
  "Предыдущая страница": "Previous page",
  "Следующая страница": "Next page",
  "Админ-панель": "Admin panel",
  "Администратор": "Administrator",
  "Управление товарами": "Product management",
  "Режим": "Mode",
  "Добавить товар": "Add product",
  "Редактировать товар": "Edit product",
  "Выберите товар": "Choose product",
  "Название": "Name",
  "ID категории": "Category ID",
  "Цена": "Price",
  "Изображение": "Image",
  "Описание": "Description",
  "Ширина": "Width",
  "Плотность": "Density",
  "В наличии": "In stock",
  "Сохранить": "Save",
  "Отмена": "Cancel",
  "Удалить товар": "Delete product",
  "Заказы": "Orders",
  "№ заказа": "Order no.",
  "Дата заказа": "Order date",
  "Покупатель": "Customer",
  "Статус": "Status",
  "Сумма": "Amount",
  "Отгрузка": "Shipment",
  "Товары": "Products",
  "Детали": "Details",
  "Действия": "Actions",
  "Ожидает": "Pending",
  "Принят": "Accepted",
  "В обработке": "Processing",
  "Отправлен": "Shipped",
  "Доставлен": "Delivered",
  "Получен": "Received",
  "Отменён": "Canceled",
  "Ожидает обработки": "Awaiting processing",
  "Готовится": "Preparing",
};

const EN_TEXT = {
  ...TEXT,
  ...EN_MESSAGES,
};

const VALUE_TRANSLATIONS = {
  product: {
    "Кулинарная гладь": "Cotton jersey",
    "Вискоза": "Viscose",
    "Бифлекс": "Biflex",
    "Флис": "Fleece",
    "Футер": "French terry",
    "Футер диагональ": "Diagonal french terry",
    "Футер 3-х нитка": "3-thread french terry",
    "Футер 3-х нитка начес": "Brushed 3-thread french terry",
    "Футер петля": "Loop french terry",
    "Футер 2-х нитка": "2-thread french terry",
    "Интерлок": "Interlock",
    "Капитоний": "Capiton",
    "Кашкорсе": "Kashkorse",
    "Рибана": "Rib knit",
    "Пике": "Pique",
    "Селаник": "Selanik",
    "Велюр": "Velour",
    "Махра": "Terry cloth",
    "Лапша": "Ribbed knit",
    "Лакоста": "Lacoste",
    "Супрем": "Supreme",
    "Джерси": "Jersey",
    "Френч Терри": "French terry",
  },
  color: {
    "Бежевый": "Beige",
    "Белый": "White",
    "Зеленый": "Green",
    "Красный": "Red",
    "Коричневый": "Brown",
    "Оранжевый": "Orange",
    "Розовый": "Pink",
    "Светло-серый": "Light grey",
    "Серый": "Grey",
    "Синий": "Blue",
    "Фиолетовый": "Purple",
    "Черный": "Black",
  },
  quality: {
    "Антипиллинг": "Anti-pilling",
    "Компакт пенье": "Compact combed",
    "Open end": "Open end",
    "Карде": "Carded",
    "Пенье": "Combed",
    "Премиум": "Premium",
  },
  person: {
    "Ольга": "Olga",
    "Анастасия": "Anastasia",
    "Екатерина": "Ekaterina",
    "Бекетов Никита": "Nikita Beketov",
    "Гуринович Максим Александрович": "Maksim Gurinovich",
    "Савицкая Екатерина Олеговна": "Ekaterina Savitskaya",
    "Сидоренко Дмитрий Викторович": "Dmitry Sidorenko",
    "Мороз Мария Игоревна": "Maria Moroz",
    "Лисовский Павел Андреевич": "Pavel Lisovsky",
    "Новик Алина Сергеевна": "Alina Novik",
    "Ковалев Иван Петрович": "Ivan Kovalev",
    "Стрелаков Андрей": "Andrey Strelakov",
  },
  review: {
    "Очень довольна качеством тканей, которые заказывала у вас. Материал оказался именно таким, как был представлен на сайте. Цвет полностью соответствует фотографиям и не отличается вживую. Ткань приятная на ощупь, мягкая и плотная одновременно. После стирки материал не сел и не потерял форму. Заказ пришёл быстро и был аккуратно упакован. Отдельно хочу отметить удобство выбора товаров в каталоге. Все характеристики указаны подробно и понятно. Уже использовала ткань для пошива нескольких изделий и осталась довольна результатом. Обязательно буду заказывать ещё и рекомендовать ваш магазин знакомым": "I am very satisfied with the quality of the fabrics I ordered from you. The material was exactly as shown on the site. The color fully matches the photos and looks the same in person. The fabric feels pleasant, soft, and dense at the same time. After washing, it did not shrink or lose its shape. The order arrived quickly and was neatly packed. I also want to note how convenient it is to choose products in the catalog. All characteristics are detailed and clear. I have already used the fabric to sew several items and am very happy with the result. I will definitely order again and recommend your store to friends.",
    "Недавно впервые оформила заказ и осталась очень довольна покупкой. Ассортимент тканей большой, поэтому легко подобрать подходящий вариант. Менеджер быстро ответил на все мои вопросы и помог с выбором. Качество ткани оказалось даже лучше, чем я ожидала. Материал хорошо держит форму и выглядит дорого. Цвет насыщенный и красивый, без каких-либо дефектов. Доставка была выполнена точно в обещанные сроки. Особенно понравилось, что ткань пришла без повреждений и заломов. Работать с таким материалом одно удовольствие. Спасибо за отличный сервис и качественную продукцию": "I recently placed my first order and was very happy with the purchase. The fabric assortment is large, so it is easy to find a suitable option. The manager quickly answered all my questions and helped me choose. The fabric quality turned out even better than I expected. The material holds its shape well and looks premium. The color is rich and beautiful, with no defects. Delivery arrived exactly within the promised time. I especially liked that the fabric came without damage or creases. Working with this material is a pleasure. Thank you for the excellent service and quality products.",
    "Заказывала несколько видов трикотажного полотна для пошива одежды. Все ткани пришли качественные и полностью соответствовали описанию. Материал хорошо тянется и при этом не теряет форму. После нескольких стирок изделия выглядят как новые. Очень понравилось качество окрашивания ткани, цвет остаётся ярким. Сайт удобный и понятный даже для первого заказа. Быстро нашла нужный товар благодаря фильтрам и поиску. Порадовали доступные цены и большой выбор расцветок. Видно, что компания внимательно относится к своим клиентам. Буду обращаться к вам снова": "I ordered several types of knitted fabric for sewing clothes. All fabrics arrived in good quality and fully matched the descriptions. The material stretches well while keeping its shape. After several washes, the garments look like new. I really liked the dyeing quality: the color stays bright. The site is convenient and easy to understand even for a first order. I quickly found the product I needed using filters and search. The affordable prices and large choice of colors were a pleasant surprise. It is clear that the company treats its customers with care. I will order from you again.",
  },
};

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function interpolate(value, replacements = {}) {
  return Object.entries(replacements).reduce((result, [key, replacement]) => {
    return result.replaceAll(`{${key}}`, replacement);
  }, value);
}

function getLanguage() {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    return LANGUAGES.includes(savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    return;
  }
}

function getDictionary() {
  return getLanguage() === "en" ? EN_TEXT : TEXT;
}

function t(key, replacements = {}) {
  if (getLanguage() === "ru") {
    return interpolate(MESSAGES[key] || key, replacements);
  }

  return interpolate(EN_MESSAGES[key] || EN_TEXT[key] || key, replacements);
}

function translateValue(group, value) {
  const text = String(value || "");

  if (getLanguage() === "ru") {
    return text;
  }

  const normalized = normalize(text);
  const direct = VALUE_TRANSLATIONS[group]?.[normalized] || EN_TEXT[normalized];

  if (direct) {
    return direct;
  }

  return text
    .replace(/\bсм\b/g, "cm")
    .replace(/см/g, "cm")
    .replace(/\bкг\b/g, "kg")
    .replace(/кг/g, "kg")
    .replace(/г\/м²/g, "g/m²")
    .replace(/хлопок/g, "cotton")
    .replace(/эластан/g, "elastane")
    .replace(/полиэстер/g, "polyester")
    .replace(/вискоза/g, "viscose");
}

function translateString(value) {
  const text = String(value || "");
  const normalized = normalize(text);

  if (!normalized) {
    return text;
  }

  if (getLanguage() === "ru") {
    return text;
  }

  const translation = getDictionary()[normalized] || translateValue("product", normalized);

  if (!translation || translation === normalized) {
    return text;
  }

  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";
  return `${leading}${translation}${trailing}`;
}

function translateElement(element) {
  const textKey = element.dataset.i18n;
  const placeholderKey = element.dataset.i18nPlaceholder;
  const ariaKey = element.dataset.i18nAriaLabel;
  const titleKey = element.dataset.i18nTitle;

  if (textKey) {
    element.textContent = t(textKey);
  }

  if (placeholderKey) {
    element.setAttribute("placeholder", t(placeholderKey));
  }

  if (ariaKey) {
    element.setAttribute("aria-label", t(ariaKey));
  }

  if (titleKey) {
    element.setAttribute("title", t(titleKey));
  }
}

function translateTextNodes(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;

      if (
        !parent ||
        ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName) ||
        parent.closest("[data-no-i18n]")
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      return originalTextNodes.has(node) || /[\u0400-\u04ff]/.test(node.nodeValue || "")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });

  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach((node) => {
    if (!originalTextNodes.has(node) && /[\u0400-\u04ff]/.test(node.nodeValue || "")) {
      originalTextNodes.set(node, node.nodeValue);
    }

    const originalValue = originalTextNodes.get(node) || node.nodeValue;
    node.nodeValue = getLanguage() === "ru" ? originalValue : translateString(originalValue);
  });
}

function translateAttributes(root = document) {
  ["placeholder", "aria-label", "title", "alt"].forEach((attribute) => {
    root.querySelectorAll(`[${attribute}]`).forEach((element) => {
      const value = element.getAttribute(attribute);
      let attributes = originalAttributes.get(element);

      if (!attributes) {
        attributes = {};
        originalAttributes.set(element, attributes);
      }

      if (!attributes[attribute] && /[\u0400-\u04ff]/.test(value || "")) {
        attributes[attribute] = value;
      }

      if (attributes[attribute]) {
        element.setAttribute(
          attribute,
          getLanguage() === "ru" ? attributes[attribute] : translateString(attributes[attribute]),
        );
      }
    });
  });
}

function updateLanguageControls() {
  document.querySelectorAll("[data-language-toggle]").forEach((control) => {
    const language = getLanguage();
    control.innerHTML = language === "en" ? "RU / <b>EN</b>" : "<b>RU</b> / EN";
    control.setAttribute("aria-label", language === "en" ? "Switch language to Russian" : "Переключить язык на английский");
  });
}

function translatePage(root = document) {
  document.documentElement.lang = getLanguage();
  root.querySelectorAll("[data-i18n], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title]").forEach(translateElement);
  translateTextNodes(root.body || root);
  translateAttributes(root);
  updateLanguageControls();
}

function setLanguage(language) {
  const nextLanguage = LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  saveLanguage(nextLanguage);
  translatePage();
  window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { language: nextLanguage } }));
}

function toggleLanguage() {
  setLanguage(getLanguage() === "ru" ? "en" : "ru");
}

function resetLanguage() {
  setLanguage(DEFAULT_LANGUAGE);
}

function bindLanguageControls() {
  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-language-toggle]");

    if (!control) {
      return;
    }

    event.preventDefault();
    toggleLanguage();
  });

  document.addEventListener("keydown", (event) => {
    const control = event.target.closest("[data-language-toggle]");

    if (!control || !["Enter", " "].includes(event.key)) {
      return;
    }

    event.preventDefault();
    toggleLanguage();
  });
}

function initI18n() {
  translatePage();
  bindLanguageControls();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initI18n);
} else {
  initI18n();
}

window.SakaI18n = {
  getLanguage,
  resetLanguage,
  setLanguage,
  t,
  translatePage,
  translateValue,
};

export {
  getLanguage,
  resetLanguage,
  setLanguage,
  t,
  translatePage,
  translateValue,
};
