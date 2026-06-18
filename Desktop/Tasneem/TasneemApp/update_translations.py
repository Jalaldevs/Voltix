import re
import codecs

translations = {
    "english": {
        "iapBody": "The App offers auto-renewable subscriptions. All payments are processed securely. Subscriptions are managed entirely by the Apple App Store or Google Play Console / Store, depending on your platform. You can manage or cancel your subscription at any time through your Apple or Google Play account settings.",
        "importantBody": "By subscribing, you understand and agree that you are paying for a MONTHLY subscription with TasneemApp. You also agree that the developer reserves the right to make the app completely free in the future, or to increase or decrease the search limits at any time, without prior notice. If the app is removed from the store, you can continue renewing your subscription and being charged, but if you uninstall it even mid-subscription you will not be able to install it again.",
        "legalUseBody": "You agree not to misuse, exploit, reverse-engineer, or alter the source code of the app to bypass payment walls or limitations. Attempting to cheat the system is strictly prohibited and is considered a personal offense, a breach of trust, and a violation of these terms.",
        "platformDifferencesBody": "Please note that premium features and limitations may vary between Android and iOS (iPhone) devices. For example, Android users receive unlimited free access to general and Sunnah searches, while all Quran searches are strictly exclusive to Premium. Conversely, iOS users have a global daily free limit for all search types, and Premium removes this limit entirely. These differences exist due to the distinct technical architectures of each operating system, and the development team has intentionally designed the app this way to provide the best possible experience on each platform.",
        "androidSearchTitle": "Unlimited Quran References Searching"
    },
    "arabic": {
        "iapBody": "يُقدم التطبيق اشتراكات تتجدد تلقائيًا. تتم معالجة جميع المدفوعات بشكل آمن. تتم إدارة الاشتراكات بالكامل بواسطة متجر Apple App Store أو Google Play Console / Store، حسب منصتك. يمكنك إدارة اشتراكك أو إلغاؤه في أي وقت من خلال إعدادات حسابك.",
        "importantBody": "بالاشتراك، أنت تفهم وتوافق على أنك تدفع مقابل اشتراك شهري مع تطبيق TasneemApp. كما توافق على أن المطور يحتفظ بالحق في جعل التطبيق مجانيًا بالكامل في المستقبل، أو زيادة أو تقليل حدود البحث في أي وقت دون إشعار مسبق. إذا تمت إزالة التطبيق من المتجر، يمكنك الاستمرار في تجديد اشتراكك، ولكن إذا قمت بإلغاء تثبيته فلن تتمكن من تثبيته مرة أخرى.",
        "legalUseBody": "أنت توافق على عدم إساءة استخدام التطبيق أو استغلاله أو إجراء هندسة عكسية أو تغيير الكود المصدري لتجاوز القيود أو بوابات الدفع. محاولة الغش ممنوعة منعاً باتاً وتعتبر إساءة شخصية وخرقاً للثقة وانتهاكاً لهذه الشروط.",
        "platformDifferencesBody": "يرجى ملاحظة أن الميزات المميزة والقيود قد تختلف بين أجهزة Android و iOS (iPhone). على سبيل المثال، يحصل مستخدمو Android على وصول مجاني غير محدود لعمليات البحث العامة والسنّة، بينما عمليات بحث القرآن حصرية بالكامل للاشتراك المميز. بالمقابل، يمتلك مستخدمو iOS حدًا يوميًا مجانيًا لجميع أنواع البحث، والاشتراك المميز يزيل هذا الحد تمامًا. توجد هذه الاختلافات بسبب البنى التقنية المختلفة لكل نظام تشغيل.",
        "androidSearchTitle": "بحث غير محدود في مراجع القرآن"
    },
    "chinese": {
        "iapBody": "该应用提供自动续期订阅。所有付款均安全处理。订阅完全由 Apple App Store 或 Google Play Console / Store 管理（取决于您的平台）。您可以随时通过账户设置管理或取消订阅。",
        "importantBody": "订阅即表示您了解并同意您正在支付 TasneemApp 的包月订阅费用。您还同意开发者保留在未来将应用完全免费的权利，或随时增加或减少搜索限制，恕不另行通知。如果应用从商店下架，您可以继续续订，但如果您卸载它，将无法再次安装。",
        "legalUseBody": "您同意不滥用、利用、进行逆向工程或更改应用的源代码以绕过付费墙或限制。严禁尝试作弊，这被视为个人冒犯、违反信任以及违反这些条款。",
        "platformDifferencesBody": "请注意，Android 和 iOS (iPhone) 设备的高级功能和限制可能有所不同。例如，Android 用户可以无限制地免费进行一般和圣训搜索，而所有古兰经搜索则严格仅限于高级订阅。相反，iOS 用户对所有搜索类型都有全球每日免费限制，高级订阅会完全取消此限制。由于每个操作系统的技术架构不同，开发团队有意这样设计应用，以提供最佳体验。",
        "androidSearchTitle": "无限的古兰经参考文献搜索"
    },
    "hindi": {
        "iapBody": "ऐप स्वतः-नवीकरणीय सदस्यताएँ प्रदान करता है। सभी भुगतान सुरक्षित रूप से संसाधित किए जाते हैं। सदस्यताएँ पूरी तरह से Apple App Store या Google Play Console / Store द्वारा प्रबंधित की जाती हैं। आप किसी भी समय अपनी सदस्यता का प्रबंधन या रद्दीकरण कर सकते हैं।",
        "importantBody": "सदस्यता लेकर, आप समझते हैं और सहमत हैं कि आप TasneemApp के साथ मासिक सदस्यता के लिए भुगतान कर रहे हैं। आप यह भी सहमत हैं कि डेवलपर को भविष्य में ऐप को पूरी तरह से मुफ्त बनाने, या किसी भी समय बिना पूर्व सूचना के खोज सीमा बढ़ाने या घटाने का अधिकार सुरक्षित है।",
        "legalUseBody": "आप भुगतान दीवारों या सीमाओं को बायपास करने के लिए ऐप के स्रोत कोड का दुरुपयोग, शोषण, रिवर्स-इंजीनियर या परिवर्तन न करने के लिए सहमत हैं। सिस्टम को धोखा देने का प्रयास सख्त वर्जित है और इसे एक व्यक्तिगत अपराध, विश्वास का उल्लंघन और इन शर्तों का उल्लंघन माना जाता है।",
        "platformDifferencesBody": "कृपया ध्यान दें कि Android और iOS (iPhone) उपकरणों के बीच प्रीमियम सुविधाएँ और सीमाएँ भिन्न हो सकती हैं। उदाहरण के लिए, Android उपयोगकर्ताओं को सामान्य और सुन्नत खोजों के लिए असीमित मुफ्त पहुँच मिलती है, जबकि सभी कुरान खोजें पूरी तरह से प्रीमियम के लिए विशेष हैं। इसके विपरीत, iOS उपयोगकर्ताओं के पास सभी खोज प्रकारों के लिए एक वैश्विक दैनिक मुफ्त सीमा है। ये अंतर तकनीकी वास्तुकला के कारण हैं।",
        "androidSearchTitle": "असीमित कुरान संदर्भ खोज"
    },
    "spanish": {
        "iapBody": "La App ofrece suscripciones auto-renovables. Los pagos se procesan de forma segura. Las suscripciones son gestionadas enteramente por Apple App Store o Google Play Console / Store. Puedes gestionar o cancelar tu suscripción en cualquier momento.",
        "importantBody": "Al suscribirte, entiendes y aceptas que estás pagando por una suscripción MENSUAL. También aceptas que el desarrollador se reserva el derecho de hacer la app completamente gratuita en el futuro, o de aumentar o disminuir los límites de búsqueda en cualquier momento sin previo aviso.",
        "legalUseBody": "Aceptas no hacer un mal uso, explotar, aplicar ingeniería inversa o alterar el código fuente de la app para eludir los muros de pago o limitaciones. Intentar hacer trampa está estrictamente prohibido y se considera una ofensa personal y una violación de la confianza.",
        "platformDifferencesBody": "Ten en cuenta que las funciones premium y limitaciones pueden variar entre Android e iOS. Por ejemplo, los usuarios de Android reciben acceso gratuito e ilimitado a búsquedas generales y de la Sunnah, mientras que las búsquedas del Corán son exclusivas del Premium. Por el contrario, los usuarios de iOS tienen un límite diario global. Estas diferencias existen por las distintas arquitecturas técnicas de cada sistema.",
        "androidSearchTitle": "Búsqueda Ilimitada de Referencias del Corán"
    },
    "french": {
        "iapBody": "L'application propose des abonnements auto-renouvelables. Les paiements sont traités en toute sécurité. Les abonnements sont gérés par l'Apple App Store ou Google Play Console / Store. Vous pouvez gérer ou annuler votre abonnement à tout moment.",
        "importantBody": "En vous abonnant, vous comprenez et acceptez de payer un abonnement MENSUEL. Vous acceptez également que le développeur se réserve le droit de rendre l'application entièrement gratuite à l'avenir, ou de modifier les limites de recherche à tout moment sans préavis.",
        "legalUseBody": "Vous acceptez de ne pas faire de mauvaise utilisation, exploiter, effectuer de l'ingénierie inverse ou modifier le code source pour contourner les limitations. Tenter de tricher est strictement interdit et considéré comme une offense personnelle et une violation de ces conditions.",
        "platformDifferencesBody": "Veuillez noter que les fonctionnalités premium et les limitations peuvent varier entre Android et iOS. Par exemple, les utilisateurs Android bénéficient d'un accès gratuit et illimité aux recherches générales et de la Sunna, tandis que les recherches dans le Coran sont exclusives au Premium. À l'inverse, les utilisateurs iOS ont une limite quotidienne globale. Ces différences sont dues aux architectures techniques distinctes.",
        "androidSearchTitle": "Recherche illimitée de références du Coran"
    },
    "bengali": {
        "iapBody": "অ্যাপটি স্বয়ংক্রিয়-নবায়নযোগ্য সাবস্ক্রিপশন অফার করে। সমস্ত অর্থপ্রদান নিরাপদে প্রক্রিয়া করা হয়। সাবস্ক্রিপশন সম্পূর্ণরূপে অ্যাপল অ্যাপ স্টোর বা গুগল প্লে কনসোল / স্টোর দ্বারা পরিচালিত হয়।",
        "importantBody": "সাবস্ক্রাইব করার মাধ্যমে, আপনি বুঝতে এবং সম্মত হন যে আপনি একটি মাসিক সাবস্ক্রিপশনের জন্য অর্থ প্রদান করছেন। আপনি আরও সম্মত হন যে বিকাশকারী ভবিষ্যতে অ্যাপটি সম্পূর্ণ বিনামূল্যে করার, বা যেকোনো সময় পূর্ব বিজ্ঞপ্তি ছাড়াই অনুসন্ধান সীমা পরিবর্তন করার অধিকার সংরক্ষণ করেন।",
        "legalUseBody": "আপনি অর্থপ্রদানের বাধা এড়াতে অ্যাপটির উত্স কোড অপব্যবহার, শোষণ, বিপরীত-প্রকৌশল বা পরিবর্তন না করতে সম্মত হন। প্রতারণা করার চেষ্টা কঠোরভাবে নিষিদ্ধ।",
        "platformDifferencesBody": "অনুগ্রহ করে মনে রাখবেন যে অ্যান্ড্রয়েড এবং আইওএস ডিভাইসের মধ্যে প্রিমিয়াম বৈশিষ্ট্য এবং সীমাবদ্ধতা ভিন্ন হতে পারে। উদাহরণস্বরূপ, অ্যান্ড্রয়েড ব্যবহারকারীরা সাধারণ এবং সুন্নাহ অনুসন্ধানে সীমাহীন বিনামূল্যে অ্যাক্সেস পান, যেখানে কুরআন অনুসন্ধান শুধুমাত্র প্রিমিয়ামের জন্য একচেটিয়া।",
        "androidSearchTitle": "সীমাহীন কুরআন রেফারেন্স অনুসন্ধান"
    },
    "portuguese": {
        "iapBody": "O aplicativo oferece assinaturas auto-renováveis. Todos os pagamentos são processados com segurança. As assinaturas são gerenciadas pelo Apple App Store ou Google Play Console / Store. Você pode cancelar a qualquer momento.",
        "importantBody": "Ao assinar, você entende e concorda que está pagando por uma assinatura MENSAL. Você também concorda que o desenvolvedor reserva o direito de tornar o aplicativo totalmente gratuito no futuro ou alterar os limites de busca sem aviso prévio.",
        "legalUseBody": "Você concorda em não fazer mau uso, explorar, fazer engenharia reversa ou alterar o código-fonte para contornar limites. Tentar trapacear o sistema é estritamente proibido.",
        "platformDifferencesBody": "Observe que os recursos premium e limitações podem variar entre Android e iOS. Por exemplo, os usuários do Android têm acesso gratuito ilimitado a buscas gerais e Sunnah, enquanto as buscas no Alcorão são exclusivas do Premium. Por outro lado, os usuários do iOS têm um limite diário global.",
        "androidSearchTitle": "Busca Ilimitada de Referências do Alcorão"
    },
    "russian": {
        "iapBody": "Приложение предлагает автоматически возобновляемые подписки. Платежи обрабатываются безопасно. Подписки управляются Apple App Store или Google Play Console / Store.",
        "importantBody": "Оформляя подписку, вы соглашаетесь с тем, что оплачиваете ЕЖЕМЕСЯЧНУЮ подписку. Вы также соглашаетесь, что разработчик может сделать приложение бесплатным в будущем или изменить лимиты поиска без уведомления.",
        "legalUseBody": "Вы соглашаетесь не злоупотреблять, не эксплуатировать, не выполнять обратную разработку и не изменять исходный код для обхода ограничений. Попытки обмана строго запрещены.",
        "platformDifferencesBody": "Обратите внимание, что премиум-функции и ограничения могут различаться на Android и iOS. Например, пользователи Android получают неограниченный бесплатный доступ к общим поискам и Сунне, тогда как поиск по Корану доступен только в Premium. Пользователи iOS имеют общий дневной лимит.",
        "androidSearchTitle": "Безлимитный поиск ссылок в Коране"
    },
    "urdu": {
        "iapBody": "یہ ایپ خودکار تجدید ہونے والی سبسکرپشنز پیش کرتی ہے۔ ادائیگیاں محفوظ طریقے سے پروسیس ہوتی ہیں۔ سبسکرپشنز کا مکمل انتظام Apple App Store یا Google Play Console / Store کرتے ہیں۔",
        "importantBody": "سبسکرائب کر کے، آپ اتفاق کرتے ہیں کہ آپ ماہانہ سبسکرپشن کی ادائیگی کر رہے ہیں۔ آپ یہ بھی اتفاق کرتے ہیں کہ ڈیولپر کو مستقبل میں ایپ کو بالکل مفت کرنے یا تلاش کی حد تبدیل کرنے کا حق حاصل ہے۔",
        "legalUseBody": "آپ اتفاق کرتے ہیں کہ ادائیگی کی حدود کو عبور کرنے کے لیے ایپ کے سورس کوڈ کا غلط استعمال، استحصال، ریورس انجینئر یا تبدیل نہیں کریں گے۔ دھوکہ دہی کی کوشش سختی سے منع ہے۔",
        "platformDifferencesBody": "براہ کرم نوٹ کریں کہ Android اور iOS ڈیوائسز کے درمیان پریمیم فیچرز اور حدود مختلف ہو سکتی ہیں۔ مثال کے طور پر، Android صارفین کو عام اور سنت کی تلاش تک لامحدود مفت رسائی حاصل ہے، جبکہ قرآن کی تلاش سختی سے پریمیم کے لیے مخصوص ہے۔",
        "androidSearchTitle": "قرآن کے حوالہ جات کی لامحدود تلاش"
    },
    "german": {
        "iapBody": "Die App bietet sich automatisch verlängernde Abonnements. Zahlungen werden sicher verarbeitet. Abonnements werden vollständig vom Apple App Store oder Google Play Console / Store verwaltet.",
        "importantBody": "Mit dem Abonnement stimmen Sie zu, dass Sie für ein MONATLICHES Abonnement bezahlen. Sie stimmen auch zu, dass der Entwickler sich das Recht vorbehält, die App in Zukunft völlig kostenlos zu machen oder die Suchlimits jederzeit ohne Vorankündigung zu ändern.",
        "legalUseBody": "Sie stimmen zu, den Quellcode der App nicht zu missbrauchen, auszunutzen, zurückzuentwickeln oder zu ändern, um Zahlungsbeschränkungen zu umgehen. Der Versuch zu betrügen ist strengstens untersagt.",
        "platformDifferencesBody": "Bitte beachten Sie, dass Premium-Funktionen und Einschränkungen zwischen Android und iOS variieren können. Zum Beispiel erhalten Android-Benutzer unbegrenzten kostenlosen Zugang zu allgemeinen und Sunnah-Suchen, während Koran-Suchen ausschließlich Premium sind. Im Gegensatz dazu haben iOS-Benutzer ein globales tägliches Limit.",
        "androidSearchTitle": "Unbegrenzte Koran-Referenzsuche"
    },
    "japanese": {
        "iapBody": "アプリは自動更新サブスクリプションを提供しています。すべての支払いは安全に処理されます。サブスクリプションは、プラットフォームに応じて Apple App Store または Google Play Console / Store によって完全に管理されます。",
        "importantBody": "サブスクリプションを登録することにより、月額サブスクリプションの支払いに同意したことになります。また、開発者が将来アプリを完全に無料にする権利、または予告なしにいつでも検索制限を変更する権利を留保することに同意するものとします。",
        "legalUseBody": "支払い制限を回避するために、アプリのソースコードを悪用、リバースエンジニアリング、または変更しないことに同意するものとします。不正行為は固く禁じられています。",
        "platformDifferencesBody": "プレミアム機能や制限は、Android デバイスと iOS デバイスで異なる場合があることに注意してください。たとえば、Android ユーザーは一般的な検索とスンナの検索に無料で無制限にアクセスできますが、コーランの検索はプレミアム専用です。逆に、iOS ユーザーにはすべてにグローバルな 1 日の制限があります。",
        "androidSearchTitle": "無制限のコーランリファレンス検索"
    },
    "italian": {
        "iapBody": "L'app offre abbonamenti auto-rinnovabili. Tutti i pagamenti vengono elaborati in modo sicuro. Gli abbonamenti sono gestiti da Apple App Store o Google Play Console / Store.",
        "importantBody": "Abbonandoti, comprendi e accetti di pagare un abbonamento MENSILE. Accetti inoltre che lo sviluppatore si riserva il diritto di rendere l'app completamente gratuita in futuro o di modificare i limiti di ricerca in qualsiasi momento senza preavviso.",
        "legalUseBody": "Accetti di non abusare, sfruttare, decodificare o alterare il codice sorgente per aggirare i limiti di pagamento. Tentare di barare è severamente proibito ed è considerato un'offesa personale.",
        "platformDifferencesBody": "Si prega di notare che le funzionalità e le limitazioni premium possono variare tra Android e iOS. Ad esempio, gli utenti Android ricevono accesso gratuito e illimitato alle ricerche generali e della Sunnah, mentre le ricerche nel Corano sono esclusivamente Premium. Al contrario, gli utenti iOS hanno un limite giornaliero globale.",
        "androidSearchTitle": "Ricerca Illimitata di Riferimenti del Corano"
    },
    "korean": {
        "iapBody": "앱은 자동 갱신 구독을 제공합니다. 모든 결제는 안전하게 처리됩니다. 구독은 Apple App Store 또는 Google Play Console / Store에서 전적으로 관리합니다.",
        "importantBody": "구독함으로써 월간 구독 요금을 지불한다는 것을 이해하고 동의합니다. 또한 개발자가 향후 앱을 완전히 무료로 만들거나 사전 통지 없이 언제든지 검색 제한을 변경할 수 있는 권리를 보유한다는 데 동의합니다.",
        "legalUseBody": "결제 제한을 우회하기 위해 앱의 소스 코드를 오용, 악용, 리버스 엔지니어링 또는 변경하지 않을 것에 동의합니다. 속이려는 시도는 엄격히 금지됩니다.",
        "platformDifferencesBody": "프리미엄 기능과 제한 사항은 Android와 iOS 기기 간에 다를 수 있습니다. 예를 들어, Android 사용자는 일반 및 순나 검색에 무제한 무료로 액세스할 수 있지만 꾸란 검색은 프리미엄 전용입니다. 반대로 iOS 사용자는 전역 일일 한도가 있습니다.",
        "androidSearchTitle": "무제한 꾸란 참조 검색"
    },
    "kurdish": {
        "iapBody": "بەرنامەکە بەشداریکردنی خۆکارانە نوێ دەکرێتەوە پێشکەش دەکات. هەموو پارەدانەکان بە سەلامەتی مامەڵەیان لەگەڵ دەکرێت. بەشداریکردنەکان بە تەواوی لەلایەن Apple App Store یان Google Play Console / Store بەڕێوەدەبرێن.",
        "importantBody": "بە بەشداریکردن، تۆ تێدەگەیت و ڕازیت کە پارەی بەشداریکردنی مانگانە دەدەیت. هەروەها ڕازیت کە گەشەپێدەر مافی ئەوەی هەیە لە داهاتوودا بەرنامەکە بە تەواوی بێبەرامبەر بکات، یان سنوورەکانی گەڕان لە هەر کاتێکدا بەبێ ئاگادارکردنەوەی پێشوەختە بگۆڕێت.",
        "legalUseBody": "تۆ ڕازیت کە خراپ بەکارنەهێنیت، ئیستغلال نەکەیت، ئەندازیاری پێچەوانە نەکەیت، یان کۆدی سەرچاوەی بەرنامەکە نەگۆڕیت بۆ تێپەڕاندنی سنوورەکانی پارەدان. هەوڵدان بۆ فێڵکردن بە توندی قەدەغەیە.",
        "platformDifferencesBody": "تکایە تێبینی بکە کە تایبەتمەندییە پریمیمەکان و سنووردارکردنەکان لە نێوان ئامێرەکانی ئەندرۆید و iOS جیاوازن. بۆ نموونە، بەکارهێنەرانی ئەندرۆید گەڕانی گشتی و سوننەت بە خۆڕایی و بێ سنوور وەردەگرن، لە کاتێکدا گەڕانی قورئان تەنها بۆ پریمیمە.",
        "androidSearchTitle": "گەڕانی بێ سنوور بۆ سەرچاوەکانی قورئان"
    },
    "macedonian": {
        "iapBody": "Апликацијата нуди претплати со автоматско обновување. Сите плаќања се обработуваат безбедно. Претплатите се управуваат од Apple App Store или Google Play Console / Store.",
        "importantBody": "Со претплатата разбирате и се согласувате дека плаќате МЕСЕЧНА претплата. Исто така, се согласувате дека развивачот го задржува правото да ја направи апликацијата целосно бесплатна во иднина или да ги промени ограничувањата за пребарување во кое било време без претходна најава.",
        "legalUseBody": "Се согласувате да не го злоупотребувате, искористувате, декомпилирате или менувате изворниот код за да ги заобиколите ограничувањата за плаќање. Обидот за мамење е строго забранет.",
        "platformDifferencesBody": "Ве молиме имајте предвид дека премиум функциите и ограничувањата може да се разликуваат помеѓу Android и iOS. На пример, корисниците на Android добиваат неограничен бесплатен пристап до општи и пребарувања во Суннетот, додека пребарувањата во Куранот се исклучиво Премиум.",
        "androidSearchTitle": "Неограничено пребарување на референци од Куранот"
    },
    "malay": {
        "iapBody": "Aplikasi ini menawarkan langganan boleh diperbaharui secara automatik. Semua pembayaran diproses dengan selamat. Langganan diuruskan sepenuhnya oleh Apple App Store atau Google Play Console / Store.",
        "importantBody": "Dengan melanggan, anda memahami dan bersetuju bahawa anda membayar untuk langganan BULANAN. Anda juga bersetuju bahawa pembangun berhak menjadikan aplikasi ini percuma sepenuhnya pada masa hadapan, atau mengubah had carian tanpa notis awal.",
        "legalUseBody": "Anda bersetuju untuk tidak menyalahgunakan, mengeksploitasi, merekayasa balik, atau mengubah kod sumber aplikasi untuk memintas had pembayaran. Cubaan menipu adalah dilarang sama sekali.",
        "platformDifferencesBody": "Sila ambil perhatian bahawa ciri premium dan had mungkin berbeza antara peranti Android dan iOS. Sebagai contoh, pengguna Android menerima akses percuma tanpa had kepada carian umum dan Sunnah, manakala carian Al-Quran adalah eksklusif kepada Premium. Sebaliknya, pengguna iOS mempunyai had harian.",
        "androidSearchTitle": "Carian Rujukan Al-Quran Tanpa Had"
    },
    "maltese": {
        "iapBody": "L-App toffri abbonamenti li jiġġeddu awtomatikament. Il-ħlasijiet kollha huma pproċessati b'mod sigur. L-abbonamenti huma ġestiti mill-Apple App Store jew Google Play Console / Store.",
        "importantBody": "Billi tabbona, tifhem u taqbel li qed tħallas għal abbonament XAHAR. Taqbel ukoll li l-iżviluppatur jirriżerva d-dritt li jagħmel l-app kompletament b'xejn fil-futur, jew li jbiddel il-limiti tat-tfittxija mingħajr avviż minn qabel.",
        "legalUseBody": "Taqbel li ma tabbużax, tesplojta, tagħmel reverse-engineer, jew tbiddel is-source code tal-app biex taqbeż il-limiti tal-ħlas. Li tipprova tqarraq is-sistema huwa strettament ipprojbit.",
        "platformDifferencesBody": "Jekk jogħġbok innota li karatteristiċi u limitazzjonijiet premium jistgħu jvarjaw bejn apparati Android u iOS. Per eżempju, l-utenti Android jirċievu aċċess b'xejn illimitat għal tfittxijiet ġenerali u Sunnah, filwaqt li t-tfittxijiet kollha tal-Quran huma esklussivi għal Premium.",
        "androidSearchTitle": "Tiftix Illimitat fir-Referenzi tal-Quran"
    },
    "nepali": {
        "iapBody": "यस एपले स्वतः नवीकरण हुने सदस्यताहरू प्रदान गर्दछ। सबै भुक्तानीहरू सुरक्षित रूपमा प्रशोधन गरिन्छ। सदस्यताहरू पूर्ण रूपमा Apple App Store वा Google Play Console / Store द्वारा प्रबन्धित हुन्छन्।",
        "importantBody": "सदस्यता लिएर, तपाईंले TasneemApp सँग मासिक सदस्यताका लागि भुक्तानी गर्दै हुनुहुन्छ भन्ने कुरा बुझ्नुहुन्छ र सहमत हुनुहुन्छ। तपाईं भविष्यमा एपलाई पूर्ण रूपमा निःशुल्क बनाउन, वा पूर्व सूचना बिना खोज सीमा परिवर्तन गर्न विकासकर्ताले अधिकार सुरक्षित राख्छ भनी पनि सहमत हुनुहुन्छ।",
        "legalUseBody": "तपाईं भुक्तान सीमाहरू बाइपास गर्न एपको स्रोत कोडको दुरुपयोग, शोषण, उल्टो-इन्जिनियर वा परिमार्जन नगर्न सहमत हुनुहुन्छ। प्रणालीलाई धोका दिने प्रयास कडा रूपमा निषेधित छ।",
        "platformDifferencesBody": "कृपया ध्यान दिनुहोस् कि प्रिमियम सुविधाहरू र सीमितताहरू एन्ड्रोइड र आईओएस उपकरणहरू बीच फरक हुन सक्छ। उदाहरणका लागि, एन्ड्रोइड प्रयोगकर्ताहरूले सामान्य र सुन्नाह खोजहरूमा असीमित निःशुल्क पहुँच पाउँछन्, जबकि सबै कुरान खोजहरू पूर्ण रूपमा प्रिमियमका लागि मात्र हुन्।",
        "androidSearchTitle": "असीमित कुरान सन्दर्भ खोज"
    },
    "norwegian": {
        "iapBody": "Appen tilbyr automatisk fornybare abonnementer. Alle betalinger behandles sikkert. Abonnementer administreres i sin helhet av Apple App Store eller Google Play Console / Store.",
        "importantBody": "Ved å abonnere forstår og godtar du at du betaler for et MÅNEDLIG abonnement. Du godtar også at utvikleren forbeholder seg retten til å gjøre appen helt gratis i fremtiden, eller endre søkegrensene uten forvarsel.",
        "legalUseBody": "Du godtar å ikke misbruke, utnyttja, omvendt konstruere eller endre kildekoden for å omgå betalingsmurer. Forsøk på å jukse systemet er strengt forbudt og anses som et personlig lovbrudd.",
        "platformDifferencesBody": "Vær oppmerksom på at premiumfunksjoner og begrensninger kan variere mellom Android og iOS. For eksempel får Android-brukere ubegrenset gratis tilgang til generelle og Sunnah-søk, mens alle Koran-søk er utelukkende Premium. Motsatt har iOS-brukere en global daglig grense.",
        "androidSearchTitle": "Ubegrenset Koranen Referansesøk"
    },
    "persian": {
        "iapBody": "این برنامه اشتراک های با تمدید خودکار ارائه می دهد. تمامی پرداخت ها به صورت ایمن پردازش می شوند. اشتراک ها به طور کامل توسط Apple App Store یا Google Play Console / Store مدیریت می شوند.",
        "importantBody": "با اشتراک، شما درک می کنید و موافقت می کنید که برای یک اشتراک ماهانه هزینه می پردازید. شما همچنین موافقت می کنید که توسعه دهنده این حق را دارد که در آینده برنامه را کاملا رایگان کند، یا محدودیت های جستجو را بدون اطلاع قبلی تغییر دهد.",
        "legalUseBody": "شما موافقت می کنید که برای دور زدن محدودیت های پرداخت، از کد منبع برنامه سوء استفاده، استخراج، مهندسی معکوس یا تغییر ندهید. تلاش برای تقلب در سیستم اکیدا ممنوع است و یک تخلف شخصی محسوب می شود.",
        "platformDifferencesBody": "لطفاً توجه داشته باشید که ویژگی‌های پریمیوم و محدودیت‌ها ممکن است بین دستگاه‌های اندروید و iOS متفاوت باشد. به عنوان مثال، کاربران اندروید به جستجوهای عمومی و سنت به صورت نامحدود و رایگان دسترسی دارند، در حالی که جستجوهای قرآن فقط برای پریمیوم اختصاصی است.",
        "androidSearchTitle": "جستجوی نامحدود مراجع قرآن"
    },
    "polish": {
        "iapBody": "Aplikacja oferuje subskrypcje automatycznie odnawialne. Wszystkie płatności są bezpiecznie przetwarzane. Subskrypcje są w pełni zarządzane przez Apple App Store lub Google Play Console / Store.",
        "importantBody": "Subskrybując, rozumiesz i zgadzasz się, że płacisz za MIESIĘCZNĄ subskrypcję. Zgadzasz się również, że deweloper zastrzega sobie prawo do udostępnienia aplikacji całkowicie za darmo w przyszłości lub zmiany limitów wyszukiwania bez wcześniejszego powiadomienia.",
        "legalUseBody": "Zgadzasz się nie nadużywać, nie wykorzystywać, nie modyfikować ani nie dekompilować kodu źródłowego w celu ominięcia ograniczeń. Próba oszustwa systemu jest surowo zabroniona i uważana za naruszenie zaufania.",
        "platformDifferencesBody": "Należy pamiętać, że funkcje premium i ograniczenia mogą się różnić w zależności od systemu Android i iOS. Na przykład użytkownicy Androida mają nieograniczony, bezpłatny dostęp do wyszukiwań ogólnych i Sunny, podczas gdy wyszukiwania w Koranie są wyłącznie dla kont Premium. Z kolei użytkownicy iOS mają globalny dzienny limit.",
        "androidSearchTitle": "Nielimitowane Wyszukiwanie Odniesień w Koranie"
    },
    "filipino": {
        "iapBody": "Nag-aalok ang App ng mga auto-renewable na subscription. Ligtas na pinoproseso ang lahat ng mga pagbabayad. Ang mga subscription ay ganap na pinamamahalaan ng Apple App Store o Google Play Console / Store.",
        "importantBody": "Sa pag-subscribe, nauunawaan at sumasang-ayon ka na nagbabayad ka para sa BUWANANG subscription. Sumasang-ayon ka rin na may karapatan ang developer na gawing libre ang app sa hinaharap, o baguhin ang mga limitasyon sa paghahanap nang walang paunang abiso.",
        "legalUseBody": "Sumasang-ayon ka na huwag abusuhin, samantalahin, i-reverse-engineer, o baguhin ang source code upang lampasan ang mga limitasyon sa pagbabayad. Ang pagtatangkang mandaya ay mahigpit na ipinagbabawal at itinuturing na personal na pagkakasala.",
        "platformDifferencesBody": "Mangyaring tandaan na ang mga premium na tampok at limitasyon ay maaaring mag-iba sa pagitan ng mga Android at iOS na device. Halimbawa, ang mga user ng Android ay nakakakuha ng walang limitasyong libreng pag-access sa pangkalahatan at Sunnah na mga paghahanap, habang ang mga paghahanap sa Quran ay eksklusibo sa Premium. Sa kabaligtaran, ang mga user ng iOS ay may pandaigdigang pang-araw-araw na limitasyon.",
        "androidSearchTitle": "Walang limitasyong Paghahanap ng Sanggunian sa Quran"
    },
    "romanian": {
        "iapBody": "Aplicația oferă abonamente cu reînnoire automată. Toate plățile sunt procesate în siguranță. Abonamentele sunt gestionate în întregime de Apple App Store sau Google Play Console / Store.",
        "importantBody": "Prin abonare, înțelegeți și sunteți de acord că plătiți pentru un abonament LUNAR. De asemenea, sunteți de acord că dezvoltatorul își rezervă dreptul de a face aplicația complet gratuită în viitor sau de a modifica limitele de căutare fără notificare prealabilă.",
        "legalUseBody": "Sunteți de acord să nu utilizați abuziv, să exploatați, să efectuați inginerie inversă sau să modificați codul sursă pentru a ocoli limitările de plată. Încercarea de a înșela sistemul este strict interzisă și este considerată o ofensă personală.",
        "platformDifferencesBody": "Vă rugăm să rețineți că funcțiile premium și limitările pot varia între dispozitivele Android și iOS. De exemplu, utilizatorii Android beneficiază de acces gratuit nelimitat la căutările generale și Sunnah, în timp ce căutările în Coran sunt strict exclusive Premium. Dimpotrivă, utilizatorii iOS au o limită zilnică globală.",
        "androidSearchTitle": "Căutare nelimitată de referințe Coran"
    },
    "dutch": {
        "iapBody": "De app biedt automatisch verlengbare abonnementen. Alle betalingen worden veilig verwerkt. Abonnementen worden volledig beheerd door de Apple App Store of Google Play Console / Store.",
        "importantBody": "Door u te abonneren, begrijpt u en gaat u ermee akkoord dat u betaalt voor een MAANDELIJKS abonnement. U gaat er ook mee akkoord dat de ontwikkelaar het recht behoudt om de app in de toekomst volledig gratis te maken, of de zoeklimieten te wijzigen zonder voorafgaande kennisgeving.",
        "legalUseBody": "U gaat ermee akkoord de broncode van de app niet te misbruiken, uit te buiten, te reverse-engineeren of te wijzigen om betalingslimieten te omzeilen. Pogingen om het systeem te bedriegen zijn ten strengste verboden.",
        "platformDifferencesBody": "Houd er rekening mee dat premiumfuncties en beperkingen kunnen variëren tussen Android- en iOS-apparaten. Android-gebruikers krijgen bijvoorbeeld onbeperkt gratis toegang tot algemene en Sunnah-zoekopdrachten, terwijl koranzoekopdrachten exclusief Premium zijn. iOS-gebruikers hebben daarentegen een wereldwijde dagelijkse limiet.",
        "androidSearchTitle": "Onbeperkt Zoeken naar Koranreferenties"
    },
    "slovak": {
        "iapBody": "Aplikácia ponúka automaticky obnoviteľné predplatné. Všetky platby sú spracovávané bezpečne. Predplatné sú plne spravované cez Apple App Store alebo Google Play Console / Store.",
        "importantBody": "Predplatením chápete a súhlasíte, že platíte za MESAČNÉ predplatné. Taktiež súhlasíte s tým, že vývojár si vyhradzuje právo v budúcnosti urobiť aplikáciu úplne bezplatnou alebo kedykoľvek zmeniť limity vyhľadávania bez predchádzajúceho upozornenia.",
        "legalUseBody": "Súhlasíte s tým, že nebudete zneužívať, dekompilovať alebo meniť zdrojový kód na obídenie obmedzení. Pokus o podvádzanie systému je prísne zakázaný a považuje sa za porušenie dôvery.",
        "platformDifferencesBody": "Upozorňujeme, že prémiové funkcie a obmedzenia sa môžu medzi zariadeniami Android a iOS líšiť. Napríklad používatelia Androidu majú neobmedzený bezplatný prístup k všeobecným a Sunnah vyhľadávaniam, zatiaľ čo vyhľadávania v Koráne sú výlučne prémiové. Naopak, používatelia iOS majú denný limit.",
        "androidSearchTitle": "Neobmedzené vyhľadávanie odkazov na Korán"
    },
    "somali": {
        "iapBody": "App-ka wuxuu bixiyaa rukun is-cusbooneysiinaya. Dhammaan lacag-bixinta waxaa loo maamulaa si ammaan ah. Rukunka waxaa si buuxda u maamula Apple App Store ama Google Play Console / Store.",
        "importantBody": "Markaad isdiiwaangeliso, waxaad fahmeysaa oo ogolaatay inaad bixineyso rukumo BILLE ah. Waxaad sidoo kale ogolaatay in horumariyuhu xaq u leeyahay inuu barnaamijka ka dhigo mid bilaash ah mustaqbalka, ama uu beddelo xaddidaadaha raadinta digniin la'aan.",
        "legalUseBody": "Waxaad ogolaatay in aadan si khaldan u isticmaalin, ka faa'iideysan, dib-u-curin, ama aadan beddelin koodka isha si aad uga gudubto xaddidaadaha lacag bixinta. Isku dayga inaad khiyaanayso nidaamka waa mamnuuc waxaana loo arkaa xad-gudub gaar ah.",
        "platformDifferencesBody": "Fadlan ogow in astaamaha Premium iyo xaddidaadaha ay ku kala duwanaan karaan qalabka Android iyo iOS. Tusaale ahaan, isticmaalayaasha Android waxay helaan marin bilaash ah oo aan xadidnayn ee raadinta guud iyo Sunnada, halka raadinta Quraanka ay yihiin Premium oo keliya. Taa lidkeeda, isticmaalayaasha iOS waxay leeyihiin xaddid maalinle ah.",
        "androidSearchTitle": "Raadinta Tixraacyada Quraanka ee aan Xadidnayn"
    },
    "swedish": {
        "iapBody": "Appen erbjuder automatiskt förnybara prenumerationer. Alla betalningar behandlas säkert. Prenumerationer hanteras helt av Apple App Store eller Google Play Console / Store.",
        "importantBody": "Genom att prenumerera förstår och samtycker du till att du betalar för en MÅNATLIG prenumeration. Du samtycker också till att utvecklaren förbehåller sig rätten att göra appen helt gratis i framtiden eller ändra sökgränserna utan föregående meddelande.",
        "legalUseBody": "Du samtycker till att inte missbruka, utnyttja, omvandla eller ändra källkoden för att kringgå betalningsgränser. Att försöka fuska systemet är strängt förbjudet och anses vara ett personligt brott.",
        "platformDifferencesBody": "Observera att premiumfunktioner och begränsningar kan variera mellan Android- och iOS-enheter. Till exempel får Android-användare obegränsad gratis tillgång till allmänna och Sunnah-sökningar, medan Koransökningar är exklusivt Premium. Omvänt har iOS-användare en global daglig gräns.",
        "androidSearchTitle": "Obegränsad Sökning av Koranreferenser"
    },
    "turkish": {
        "iapBody": "Uygulama otomatik yenilenen abonelikler sunar. Tüm ödemeler güvenli bir şekilde işlenir. Abonelikler tamamen Apple App Store veya Google Play Console / Store tarafından yönetilir.",
        "importantBody": "Abone olarak AYLIK bir abonelik için ödeme yaptığınızı anlıyor ve kabul ediyorsunuz. Ayrıca geliştiricinin gelecekte uygulamayı tamamen ücretsiz yapma veya önceden haber vermeksizin arama sınırlarını değiştirme hakkını saklı tuttuğunu da kabul ediyorsunuz.",
        "legalUseBody": "Ödeme duvarlarını aşmak için uygulamanın kaynak kodunu kötüye kullanmamayı, istismar etmemeyi, tersine mühendislik yapmamayı veya değiştirmemeyi kabul ediyorsunuz. Sistemi kandırmaya çalışmak kesinlikle yasaktır ve kişisel bir suç, güven ihlali olarak kabul edilir.",
        "platformDifferencesBody": "Premium özelliklerin ve kısıtlamaların Android ve iOS cihazları arasında farklılık gösterebileceğini lütfen unutmayın. Örneğin, Android kullanıcıları genel ve Sünnet aramalarına sınırsız ücretsiz erişim sağlarken, tüm Kuran aramaları tamamen Premium'a özeldir. Aksine, iOS kullanıcılarının günlük küresel bir sınırı vardır.",
        "androidSearchTitle": "Sınırsız Kuran Referansı Arama"
    },
    "uzbek": {
        "iapBody": "Ilova avtomatik yangilanadigan obunalarni taklif qiladi. Barcha to'lovlar xavfsiz tarzda amalga oshiriladi. Obunalar to'liq Apple App Store yoki Google Play Console / Store tomonidan boshqariladi.",
        "importantBody": "Obuna bo'lish orqali siz OYLIK obuna uchun to'layotganingizni tushunasiz va qabul qilasiz. Shuningdek, dasturchi kelajakda ilovani butunlay bepul qilish yoki oldindan ogohlantirmasdan qidiruv cheklovlarini o'zgartirish huquqini o'zida saqlab qolishiga rozi bo'lasiz.",
        "legalUseBody": "To'lov cheklovlarini chetlab o'tish uchun ilovaning manba kodini suiiste'mol qilmaslikka, o'zgartirmaslikka yoki teskari muhandislik qilmaslikka rozi bo'lasiz. Tizimni aldashga urinish qat'iyan man etiladi.",
        "platformDifferencesBody": "Premium xususiyatlar va cheklovlar Android va iOS qurilmalari orasida farq qilishi mumkinligiga e'tibor bering. Masalan, Android foydalanuvchilari umumiy va Sunnat qidiruvlariga cheksiz bepul kirish imkoniga ega, Qur'on qidiruvlari esa faqat Premium uchundir. Aksincha, iOS foydalanuvchilari uchun kundalik cheklov mavjud.",
        "androidSearchTitle": "Cheksiz Qur'on havolalarini qidirish"
    },
    "finnish": {
        "iapBody": "Sovellus tarjoaa automaattisesti uusiutuvia tilauksia. Kaikki maksut käsitellään turvallisesti. Tilauksia hallinnoi kokonaan Apple App Store tai Google Play Console / Store.",
        "importantBody": "Tilaamalla ymmärrät ja hyväksyt maksavasi KUUKAUSITTAISESTA tilauksesta. Hyväksyt myös, että kehittäjä pidättää oikeuden tehdä sovelluksesta tulevaisuudessa täysin ilmaisen tai muuttaa hakurajoja ilman ennakkoilmoitusta.",
        "legalUseBody": "Sitoudut olemaan väärinkäyttämättä, hyödyntämättä, takaisinmallintamatta tai muuttamatta lähdekoodia maksumuurien ohittamiseksi. Järjestelmän huijaaminen on ehdottomasti kielletty ja se katsotaan luottamuksen rikkomiseksi.",
        "platformDifferencesBody": "Huomaa, että premium-ominaisuudet ja rajoitukset voivat vaihdella Android- ja iOS-laitteiden välillä. Esimerkiksi Android-käyttäjät saavat rajoittamattoman ilmaisen pääsyn yleisiin ja Sunnah-hakuihin, kun taas Koraani-haut ovat yksinomaan Premium-ominaisuuksia. Vastaavasti iOS-käyttäjillä on maailmanlaajuinen päivittäinen raja.",
        "androidSearchTitle": "Rajaton Koraanin viitehaku"
    },
    "tamil": {
        "iapBody": "செயலி தானாகப் புதுப்பிக்கக்கூடிய சந்தாக்களை வழங்குகிறது. அனைத்து கட்டணங்களும் பாதுகாப்பாக செயலாக்கப்படுகின்றன. சந்தாக்கள் முழுமையாக Apple App Store அல்லது Google Play Console / Store மூலம் நிர்வகிக்கப்படுகின்றன.",
        "importantBody": "சந்தா செலுத்துவதன் மூலம், நீங்கள் ஒரு மாதாந்திர சந்தாவிற்கு பணம் செலுத்துகிறீர்கள் என்பதை புரிந்துகொண்டு ஒப்புக்கொள்கிறீர்கள். எதிர்காலத்தில் செயலியை முற்றிலும் இலவசமாக்குவதற்கு அல்லது முன்னறிவிப்பின்றி தேடல் வரம்புகளை மாற்றுவதற்கு டெவலப்பருக்கு உரிமை உள்ளது என்பதையும் நீங்கள் ஒப்புக்கொள்கிறீர்கள்.",
        "legalUseBody": "பணம் செலுத்தும் வரம்புகளைத் தவிர்க்க செயலியின் மூலக் குறியீட்டைத் தவறாகப் பயன்படுத்தவோ, சுரண்டவோ, தலைகீழ் பொறியியல் செய்யவோ அல்லது மாற்றவோ கூடாது என்று நீங்கள் ஒப்புக்கொள்கிறீர்கள். ஏமாற்ற முயற்சிப்பது கண்டிப்பாக தடைசெய்யப்பட்டுள்ளது.",
        "platformDifferencesBody": "Android மற்றும் iOS சாதனங்களுக்கு இடையே பிரீமியம் அம்சங்கள் மற்றும் வரம்புகள் மாறுபடலாம் என்பதை நினைவில் கொள்க. எடுத்துக்காட்டாக, Android பயனர்கள் பொது மற்றும் சுன்னா தேடல்களுக்கு வரம்பற்ற இலவச அணுகலைப் பெறுகிறார்கள், அதே நேரத்தில் குர்ஆன் தேடல்கள் பிரீமியம் மட்டுமே. மாறாக, iOS பயனர்களுக்கு தினசரி வரம்பு உள்ளது.",
        "androidSearchTitle": "வரம்பற்ற குர்ஆன் குறிப்பு தேடல்"
    }
}

def update_file(filepath):
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()

    for lang, trans in translations.items():
        match = re.search(r'const\s+' + lang + r'\s*=\s*\{', content)
        if not match:
            print(f"Could not find language block for {lang}")
            continue
            
        start_idx = match.end()
        
        terms_match = re.search(r'"termsModal"\s*:\s*\{', content[start_idx:])
        if terms_match:
            terms_start = start_idx + terms_match.end()
            bracket_count = 1
            for i, char in enumerate(content[terms_start:]):
                if char == '{':
                    bracket_count += 1
                elif char == '}':
                    bracket_count -= 1
                    if bracket_count == 0:
                        terms_end = terms_start + i
                        break
            
            terms_inner = content[terms_start:terms_end]
            
            terms_inner = re.sub(r'"iapBody"\s*:\s*".*?"', f'"iapBody": "{trans["iapBody"]}"', terms_inner, flags=re.DOTALL)
            terms_inner = re.sub(r'"importantBody"\s*:\s*".*?"', f'"importantBody": "{trans["importantBody"]}"', terms_inner, flags=re.DOTALL)
            
            if '"legalUseBody"' not in terms_inner:
                terms_inner += f',\n      "legalUseBody": "{trans["legalUseBody"]}"'
            else:
                terms_inner = re.sub(r'"legalUseBody"\s*:\s*".*?"', f'"legalUseBody": "{trans["legalUseBody"]}"', terms_inner, flags=re.DOTALL)
                
            if '"platformDifferencesBody"' not in terms_inner:
                terms_inner += f',\n      "platformDifferencesBody": "{trans["platformDifferencesBody"]}"'
            else:
                terms_inner = re.sub(r'"platformDifferencesBody"\s*:\s*".*?"', f'"platformDifferencesBody": "{trans["platformDifferencesBody"]}"', terms_inner, flags=re.DOTALL)
                
            content = content[:terms_start] + terms_inner + content[terms_end:]
            
        premium_match = re.search(r'"premium"\s*:\s*\{.*?"features"\s*:\s*\{', content[start_idx:], flags=re.DOTALL)
        if premium_match:
            features_start = start_idx + premium_match.end()
            features_inner_match = re.search(r'\}', content[features_start:])
            if features_inner_match:
                features_end = features_start + features_inner_match.start()
                features_inner = content[features_start:features_end]
                
                if '"androidSearchTitle"' not in features_inner:
                    if not features_inner.strip().endswith(','):
                        features_inner = features_inner.rstrip() + ',\n      "androidSearchTitle": "' + trans['androidSearchTitle'] + '"\n    '
                    else:
                        features_inner += '\n      "androidSearchTitle": "' + trans['androidSearchTitle'] + '"\n    '
                        
                    content = content[:features_start] + features_inner + content[features_end:]
                else:
                    features_inner = re.sub(r'"androidSearchTitle"\s*:\s*".*?"', f'"androidSearchTitle": "{trans["androidSearchTitle"]}"', features_inner, flags=re.DOTALL)
                    content = content[:features_start] + features_inner + content[features_end:]

    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.write(content)
        
    print("Updated translations successfully.")

update_file('c:\\Users\\Jalal\\Desktop\\Tasneem\\TasneemApp\\app\\constants\\appTranslations.js')
