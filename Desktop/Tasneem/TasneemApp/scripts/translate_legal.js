const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/constants/appTranslations.js');
let fileContent = fs.readFileSync(targetFile, 'utf8');

const translations = {
  english: {
    privacyModal: {
      title: "Privacy Policy",
      intro: "This Privacy Policy explains how Tasneem protects your information.",
      permissionsTitle: "Permissions",
      permissionsBody: "The App may request access to location and notifications to improve the service.",
      dataTitle: "Data",
      dataBody: "We do not collect or store your payment card information.",
      thirdPartyTitle: "Third-Party",
      thirdPartyBody: "The App uses RevenueCat to manage subscriptions."
    },
    termsModal: {
      title: "Terms & Conditions",
      intro: "These Terms apply to the Tasneem application by JalalDevs.",
      iapTitle: "In-App Purchases & Subscriptions",
      iapBody: "The App offers auto-renewable subscriptions. All payments are processed securely. Subscriptions are managed entirely by the respective app store. You can manage or cancel your subscription at any time through your account settings.",
      importantTitle: "Important Condition",
      importantBody: "If the app is removed from the store, you can continue renewing your subscription and being charged, but if you uninstall it even mid-subscription you will not be able to install it again. So you agree to pay for a monthly deal with us, Tasneem App."
    }
  },
  arabic: {
    privacyModal: {
      title: "سياسة الخصوصية",
      intro: "تشرح سياسة الخصوصية هذه كيف يحمي تطبيق تسنيم معلوماتك.",
      permissionsTitle: "الأذونات",
      permissionsBody: "قد يطلب التطبيق الوصول إلى الموقع والإشعارات لتحسين الخدمة.",
      dataTitle: "البيانات",
      dataBody: "نحن لا نجمع أو نخزن معلومات بطاقة الدفع الخاصة بك.",
      thirdPartyTitle: "جهات خارجية",
      thirdPartyBody: "يستخدم التطبيق RevenueCat لإدارة الاشتراكات."
    },
    termsModal: {
      title: "الشروط والأحكام",
      intro: "تنطبق هذه الشروط على تطبيق تسنيم المقدم من JalalDevs.",
      iapTitle: "عمليات الشراء والاشتراكات داخل التطبيق",
      iapBody: "يقدم التطبيق اشتراكات تتجدد تلقائيًا. تتم معالجة جميع المدفوعات بشكل آمن. تتم إدارة الاشتراكات بالكامل بواسطة متجر التطبيقات المعني. يمكنك إدارة أو إلغاء اشتراكك في أي وقت من خلال إعدادات حسابك.",
      importantTitle: "شرط مهم",
      importantBody: "إذا تمت إزالة التطبيق من المتجر، يمكنك الاستمرار في تجديد اشتراكك وتحصيل الرسوم، ولكن إذا قمت بإلغاء تثبيته حتى في منتصف الاشتراك، فلن تتمكن من تثبيته مرة أخرى. لذا فإنك توافق على الدفع مقابل صفقة شهرية معنا، تطبيق تسنيم."
    }
  },
  chinese: {
    privacyModal: {
      title: "隐私政策",
      intro: "本隐私政策解释了Tasneem如何保护您的信息。",
      permissionsTitle: "权限",
      permissionsBody: "应用程序可能请求访问位置和通知以改进服务。",
      dataTitle: "数据",
      dataBody: "我们不会收集或存储您的支付卡信息。",
      thirdPartyTitle: "第三方",
      thirdPartyBody: "应用程序使用RevenueCat管理订阅。"
    },
    termsModal: {
      title: "条款与条件",
      intro: "这些条款适用于由JalalDevs提供的Tasneem应用程序。",
      iapTitle: "应用内购买与订阅",
      iapBody: "应用程序提供自动续订订阅。所有付款均安全处理。订阅完全由各自的应用商店管理。您可以随时通过帐户设置管理或取消订阅。",
      importantTitle: "重要条件",
      importantBody: "如果应用程序从商店中删除，您可以继续续订订阅并被扣款，但如果您在订阅期间卸载它，您将无法再次安装。因此，您同意与我们（Tasneem应用程序）达成按月付费协议。"
    }
  },
  hindi: {
    privacyModal: {
      title: "गोपनीयता नीति",
      intro: "यह गोपनीयता नीति बताती है कि Tasneem आपकी जानकारी की सुरक्षा कैसे करता है।",
      permissionsTitle: "अनुमतियां",
      permissionsBody: "सेवा में सुधार के लिए ऐप स्थान और सूचनाओं तक पहुंच का अनुरोध कर सकता है।",
      dataTitle: "डेटा",
      dataBody: "हम आपके भुगतान कार्ड की जानकारी एकत्र या संग्रहीत नहीं करते हैं।",
      thirdPartyTitle: "तीसरे पक्ष",
      thirdPartyBody: "ऐप सदस्यता प्रबंधित करने के लिए RevenueCat का उपयोग करता है।"
    },
    termsModal: {
      title: "नियम और शर्तें",
      intro: "ये शर्तें JalalDevs द्वारा प्रदान किए गए Tasneem एप्लिकेशन पर लागू होती हैं।",
      iapTitle: "इन-ऐप खरीदारी और सदस्यता",
      iapBody: "ऐप ऑटो-रिन्यूएबल सदस्यता प्रदान करता है। सभी भुगतानों को सुरक्षित रूप से संसाधित किया जाता है। सदस्यता पूरी तरह से संबंधित ऐप स्टोर द्वारा प्रबंधित की जाती है। आप अपनी खाता सेटिंग के माध्यम से किसी भी समय अपनी सदस्यता का प्रबंधन या रद्दीकरण कर सकते हैं।",
      importantTitle: "महत्वपूर्ण शर्त",
      importantBody: "यदि ऐप स्टोर से हटा दिया जाता है, तो आप अपनी सदस्यता का नवीनीकरण और शुल्क लिया जाना जारी रख सकते हैं, लेकिन यदि आप इसे मध्य-सदस्यता में भी अनइंस्टॉल करते हैं तो आप इसे फिर से इंस्टॉल नहीं कर पाएंगे। इसलिए आप हमारे साथ, तस्नीम ऐप के साथ मासिक सौदे का भुगतान करने के लिए सहमत हैं।"
    }
  },
  spanish: {
    privacyModal: {
      title: "Política de Privacidad",
      intro: "Esta Política de Privacidad explica cómo Tasneem protege su información.",
      permissionsTitle: "Permisos",
      permissionsBody: "La aplicación puede solicitar acceso a la ubicación y notificaciones para mejorar el servicio.",
      dataTitle: "Datos",
      dataBody: "No recopilamos ni almacenamos la información de su tarjeta de pago.",
      thirdPartyTitle: "Terceros",
      thirdPartyBody: "La aplicación utiliza RevenueCat para gestionar las suscripciones."
    },
    termsModal: {
      title: "Términos y Condiciones",
      intro: "Estos Términos se aplican a la aplicación Tasneem proporcionada por JalalDevs.",
      iapTitle: "Compras y Suscripciones",
      iapBody: "La aplicación ofrece suscripciones auto-renovables. Todos los pagos se procesan de forma segura. Las suscripciones son gestionadas íntegramente por la tienda de aplicaciones respectiva. Puede gestionar o cancelar su suscripción en cualquier momento desde la configuración de su cuenta.",
      importantTitle: "Condición Importante",
      importantBody: "Si la aplicación es eliminada de la tienda, puede continuar renovando su suscripción y se le seguirá cobrando, pero si la desinstala incluso a mitad de suscripción no podrá volver a instalarla. Por lo tanto, usted acepta pagar un acuerdo mensual con nosotros, Tasneem App."
    }
  },
  french: {
    privacyModal: {
      title: "Politique de Confidentialité",
      intro: "Cette politique explique comment Tasneem protège vos informations.",
      permissionsTitle: "Autorisations",
      permissionsBody: "L'application peut demander l'accès à la localisation et aux notifications pour améliorer le service.",
      dataTitle: "Données",
      dataBody: "Nous ne collectons ni ne stockons les informations de votre carte de paiement.",
      thirdPartyTitle: "Tiers",
      thirdPartyBody: "L'application utilise RevenueCat pour gérer les abonnements."
    },
    termsModal: {
      title: "Conditions Générales",
      intro: "Ces conditions s'appliquent à l'application Tasneem fournie par JalalDevs.",
      iapTitle: "Achats et Abonnements",
      iapBody: "L'application propose des abonnements auto-renouvelables. Tous les paiements sont traités de manière sécurisée. Les abonnements sont gérés par la boutique d'applications. Vous pouvez gérer ou annuler votre abonnement à tout moment dans les paramètres de votre compte.",
      importantTitle: "Condition Importante",
      importantBody: "Si l'application est retirée de la boutique, vous pouvez continuer à renouveler votre abonnement et être facturé, mais si vous la désinstallez même en cours d'abonnement, vous ne pourrez plus l'installer. Vous acceptez donc de payer un abonnement mensuel avec nous, Tasneem App."
    }
  },
  bengali: {
    privacyModal: {
      title: "গোপনীয়তা নীতি",
      intro: "এই গোপনীয়তা নীতি ব্যাখ্যা করে কিভাবে Tasneem আপনার তথ্য রক্ষা করে।",
      permissionsTitle: "অনুমতি",
      permissionsBody: "পরিষেবা উন্নত করার জন্য অ্যাপটি অবস্থান এবং বিজ্ঞপ্তিগুলির অ্যাক্সেস চাইতে পারে।",
      dataTitle: "তথ্য",
      dataBody: "আমরা আপনার পেমেন্ট কার্ডের তথ্য সংগ্রহ বা সংরক্ষণ করি না।",
      thirdPartyTitle: "তৃতীয় পক্ষ",
      thirdPartyBody: "অ্যাপটি সাবস্ক্রিপশন পরিচালনা করতে RevenueCat ব্যবহার করে।"
    },
    termsModal: {
      title: "শর্তাবলী",
      intro: "এই শর্তাবলী JalalDevs দ্বারা সরবরাহকৃত Tasneem অ্যাপ্লিকেশনের জন্য প্রযোজ্য।",
      iapTitle: "অ্যাপ-মধ্যস্থ কেনাকাটা এবং সাবস্ক্রিপশন",
      iapBody: "অ্যাপটি স্বয়ংক্রিয় পুনর্নবীকরণযোগ্য সাবস্ক্রিপশন অফার করে। সমস্ত পেমেন্ট নিরাপদে প্রক্রিয়া করা হয়। সাবস্ক্রিপশনগুলি সংশ্লিষ্ট অ্যাপ স্টোর দ্বারা পরিচালিত হয়। আপনি আপনার অ্যাকাউন্ট সেটিংসের মাধ্যমে যেকোনো সময় আপনার সাবস্ক্রিপশন পরিচালনা বা বাতিল করতে পারেন।",
      importantTitle: "গুরুত্বপূর্ণ শর্ত",
      importantBody: "অ্যাপটি যদি স্টোর থেকে মুছে ফেলা হয়, আপনি আপনার সাবস্ক্রিপশন পুনর্নবীকরণ এবং চার্জ করা চালিয়ে যেতে পারেন, কিন্তু আপনি যদি সাবস্ক্রিপশনের মাঝখানেও এটি আনইনস্টল করেন তবে আপনি এটি আর ইনস্টল করতে পারবেন না। তাই আপনি আমাদের, তাসনিম অ্যাপের সাথে একটি মাসিক চুক্তির জন্য অর্থ প্রদান করতে সম্মত হচ্ছেন।"
    }
  },
  portuguese: {
    privacyModal: {
      title: "Política de Privacidade",
      intro: "Esta Política de Privacidade explica como Tasneem protege suas informações.",
      permissionsTitle: "Permissões",
      permissionsBody: "O aplicativo pode solicitar acesso à localização e notificações para melhorar o serviço.",
      dataTitle: "Dados",
      dataBody: "Não coletamos ou armazenamos as informações do seu cartão de pagamento.",
      thirdPartyTitle: "Terceiros",
      thirdPartyBody: "O aplicativo usa a RevenueCat para gerenciar assinaturas."
    },
    termsModal: {
      title: "Termos e Condições",
      intro: "Estes Termos se aplicam ao aplicativo Tasneem fornecido por JalalDevs.",
      iapTitle: "Compras e Assinaturas",
      iapBody: "O aplicativo oferece assinaturas auto-renováveis. Todos os pagamentos são processados com segurança. As assinaturas são gerenciadas integralmente pela respectiva loja de aplicativos. Você pode gerenciar ou cancelar sua assinatura a qualquer momento através das configurações da sua conta.",
      importantTitle: "Condição Importante",
      importantBody: "Se o aplicativo for removido da loja, você poderá continuar renovando sua assinatura e sendo cobrado, mas se você desinstalá-lo mesmo no meio da assinatura, não poderá instalá-lo novamente. Portanto, você concorda em pagar por um acordo mensal conosco, Tasneem App."
    }
  },
  russian: {
    privacyModal: {
      title: "Политика конфиденциальности",
      intro: "Эта Политика объясняет, как Tasneem защищает вашу информацию.",
      permissionsTitle: "Разрешения",
      permissionsBody: "Приложение может запросить доступ к местоположению и уведомлениям.",
      dataTitle: "Данные",
      dataBody: "Мы не собираем и не храним данные вашей платежной карты.",
      thirdPartyTitle: "Третьи стороны",
      thirdPartyBody: "Приложение использует RevenueCat для управления подписками."
    },
    termsModal: {
      title: "Условия и положения",
      intro: "Эти Условия применяются к приложению Tasneem, предоставляемому JalalDevs.",
      iapTitle: "Покупки и подписки",
      iapBody: "Приложение предлагает авто-возобновляемые подписки. Все платежи обрабатываются безопасно.",
      importantTitle: "Важное условие",
      importantBody: "Если приложение будет удалено из магазина, вы сможете продолжить продлевать подписку и платить, но если вы удалите его даже в середине подписки, вы не сможете установить его снова. Таким образом, вы соглашаетесь оплачивать ежемесячную сделку с нами, Tasneem App."
    }
  },
  urdu: {
    privacyModal: {
      title: "پالیسی",
      intro: "یہ پرائیویسی پالیسی بتاتی ہے کہ تسنیم آپ کی معلومات کی حفاظت کیسے کرتی ہے۔",
      permissionsTitle: "اجازتیں",
      permissionsBody: "ایپ سروس کو بہتر بنانے کے لیے لوکیشن اور نوٹیفیکیشنز تک رسائی طلب کر سکتی ہے۔",
      dataTitle: "ڈیٹا",
      dataBody: "ہم آپ کے پیمنٹ کارڈ کی معلومات جمع یا محفوظ نہیں کرتے۔",
      thirdPartyTitle: "تھرڈ پارٹی",
      thirdPartyBody: "ایپ سبسکرپشنز کو منظم کرنے کے لیے RevenueCat کا استعمال کرتی ہے۔"
    },
    termsModal: {
      title: "شرائط و ضوابط",
      intro: "یہ شرائط JalalDevs کی جانب سے فراہم کردہ تسنیم ایپلی کیشن پر لاگو ہوتی ہیں۔",
      iapTitle: "ان ایپ خریداریاں اور سبسکرپشنز",
      iapBody: "ایپ خودکار تجدید ہونے والی سبسکرپشنز پیش کرتی ہے۔ تمام ادائیگیاں محفوظ طریقے سے کی جاتی ہیں۔",
      importantTitle: "اہم شرط",
      importantBody: "اگر ایپ کو اسٹور سے ہٹا دیا جاتا ہے، تو آپ اپنی سبسکرپشن کی تجدید اور چارجز ادا کرنا جاری رکھ سکتے ہیں، لیکن اگر آپ اسے درمیانی سبسکرپشن کے دوران بھی ان انسٹال کر دیتے ہیں تو آپ اسے دوبارہ انسٹال نہیں کر پائیں گے۔ لہذا آپ تسنیم ایپ کے ساتھ ماہانہ ڈیل کی ادائیگی کے لیے متفق ہیں۔"
    }
  },
  german: {
    privacyModal: {
      title: "Datenschutzerklärung",
      intro: "Diese Richtlinie erklärt, wie Tasneem Ihre Informationen schützt.",
      permissionsTitle: "Berechtigungen",
      permissionsBody: "Die App kann Zugriff auf den Standort anfordern.",
      dataTitle: "Daten",
      dataBody: "Wir speichern keine Zahlungsdaten.",
      thirdPartyTitle: "Dritte",
      thirdPartyBody: "Die App nutzt RevenueCat für Abonnements."
    },
    termsModal: {
      title: "Allgemeine Geschäftsbedingungen",
      intro: "Diese Bedingungen gelten für die Tasneem App von JalalDevs.",
      iapTitle: "Abonnements",
      iapBody: "Die App bietet automatisch verlängerbare Abonnements an.",
      importantTitle: "Wichtige Bedingung",
      importantBody: "Wenn die App aus dem Store entfernt wird, können Sie Ihr Abonnement weiterhin verlängern und bezahlen, aber wenn Sie sie deinstallieren, können Sie sie nicht erneut installieren. Sie stimmen also einem monatlichen Vertrag mit uns, der Tasneem App, zu."
    }
  },
  japanese: {
    privacyModal: {
      title: "プライバシーポリシー",
      intro: "このポリシーはTasneemがあなたの情報を保護する方法を説明します。",
      permissionsTitle: "権限",
      permissionsBody: "アプリは位置情報と通知へのアクセスを要求する場合があります。",
      dataTitle: "データ",
      dataBody: "私たちはあなたの支払いカード情報を保存しません。",
      thirdPartyTitle: "第三者",
      thirdPartyBody: "アプリはサブスクリプション管理にRevenueCatを使用します。"
    },
    termsModal: {
      title: "利用規約",
      intro: "これらの利用規約はJalalDevsが提供するTasneemアプリに適用されます。",
      iapTitle: "アプリ内購入とサブスクリプション",
      iapBody: "アプリは自動更新サブスクリプションを提供します。支払いは安全に処理されます。",
      importantTitle: "重要な条件",
      importantBody: "アプリがストアから削除された場合、サブスクリプションの更新と課金を継続できますが、サブスクリプションの途中でアンインストールすると再インストールできなくなります。したがって、あなたは私たちTasneem Appとの月額契約の支払いに同意するものとします。"
    }
  },
  italian: {
    privacyModal: {
      title: "Informativa sulla privacy",
      intro: "Questa informativa spiega come Tasneem protegge le tue informazioni.",
      permissionsTitle: "Permessi",
      permissionsBody: "L'app può richiedere l'accesso alla posizione per migliorare il servizio.",
      dataTitle: "Dati",
      dataBody: "Non raccogliamo né memorizziamo le informazioni della tua carta di pagamento.",
      thirdPartyTitle: "Terze parti",
      thirdPartyBody: "L'app utilizza RevenueCat per gestire gli abbonamenti."
    },
    termsModal: {
      title: "Termini e Condizioni",
      intro: "Questi Termini si applicano all'applicazione Tasneem.",
      iapTitle: "Acquisti in-app",
      iapBody: "L'app offre abbonamenti auto-rinnovabili.",
      importantTitle: "Condizione Importante",
      importantBody: "Se l'app viene rimossa dallo store, puoi continuare a rinnovare l'abbonamento e ad essere addebitato, ma se la disinstalli non potrai più installarla. Accetti quindi di pagare un accordo mensile con noi, Tasneem App."
    }
  },
  korean: {
    privacyModal: {
      title: "개인정보 보호정책",
      intro: "이 정책은 Tasneem이 귀하의 정보를 보호하는 방법을 설명합니다.",
      permissionsTitle: "권한",
      permissionsBody: "앱은 위치 및 알림에 대한 액세스를 요청할 수 있습니다.",
      dataTitle: "데이터",
      dataBody: "당사는 결제 카드 정보를 저장하지 않습니다.",
      thirdPartyTitle: "제3자",
      thirdPartyBody: "앱은 구독 관리를 위해 RevenueCat을 사용합니다."
    },
    termsModal: {
      title: "이용 약관",
      intro: "이 약관은 JalalDevs에서 제공하는 Tasneem 앱에 적용됩니다.",
      iapTitle: "인앱 결제 및 구독",
      iapBody: "앱은 자동 갱신 구독을 제공합니다.",
      importantTitle: "중요 조건",
      importantBody: "앱이 스토어에서 제거된 경우 구독을 계속 갱신하고 요금을 청구할 수 있지만 구독 중간에 제거하면 다시 설치할 수 없습니다. 따라서 귀하는 Tasneem App과 월간 거래에 대한 비용을 지불하는 데 동의합니다."
    }
  },
  kurdish: {
    privacyModal: {
      title: "Siyaseta Taybetî",
      intro: "Ev siyaset diyar dike ku Tasneem çawa zanyariyên we diparêze.",
      permissionsTitle: "Destûr",
      permissionsBody: "Serîlêdan dikare gihîştina cîh bixwaze.",
      dataTitle: "Dane",
      dataBody: "Em agahiyên qerta weya dravdanê kom nakin.",
      thirdPartyTitle: "Alên Sêyemîn",
      thirdPartyBody: "Serîlêdan RevenueCat bikar tîne."
    },
    termsModal: {
      title: "Şert û Merc",
      intro: "Ev şert ji bo sepana Tasneem derbas dibin.",
      iapTitle: "Kirînên Nav-Sepanê",
      iapBody: "Sepan aboneyên nûvekirina otomatîkî pêşkêşî dike.",
      importantTitle: "Şerta Girîng",
      importantBody: "Ger sepan ji firotgehê were rakirin, hûn dikarin nûkirina aboriya xwe bidomînin û werin xerc kirin, lê heke hûn wê rakin hûn ê nikaribin wê dîsa saz bikin. Ji ber vê yekê hûn pejirandin ku bi me, Serlêdana Tasneem re ji bo peymanek mehane bidin."
    }
  },
  macedonian: {
    privacyModal: {
      title: "Политика за приватност",
      intro: "Оваа политика објаснува како Tasneem ги штити вашите информации.",
      permissionsTitle: "Дозволи",
      permissionsBody: "Апликацијата може да побара пристап до локација.",
      dataTitle: "Податоци",
      dataBody: "Ние не ги собираме вашите податоци за плаќање.",
      thirdPartyTitle: "Трета страна",
      thirdPartyBody: "Апликацијата користи RevenueCat."
    },
    termsModal: {
      title: "Услови и правила",
      intro: "Овие Услови важат за апликацијата Tasneem.",
      iapTitle: "Купувања во апликација",
      iapBody: "Апликацијата нуди претплати.",
      importantTitle: "Важен услов",
      importantBody: "Ако апликацијата се отстрани од продавницата, можете да продолжите со обновување на вашата претплата, но ако ја деинсталирате нема да можете повторно да ја инсталирате. Значи се согласувате да плаќате месечен договор со нас, апликацијата Tasneem."
    }
  },
  malay: {
    privacyModal: {
      title: "Dasar Privasi",
      intro: "Dasar Privasi ini menerangkan bagaimana Tasneem melindungi maklumat anda.",
      permissionsTitle: "Kebenaran",
      permissionsBody: "Aplikasi mungkin meminta akses ke lokasi dan pemberitahuan.",
      dataTitle: "Data",
      dataBody: "Kami tidak menyimpan maklumat kad pembayaran anda.",
      thirdPartyTitle: "Pihak Ketiga",
      thirdPartyBody: "Aplikasi menggunakan RevenueCat untuk menguruskan langganan."
    },
    termsModal: {
      title: "Terma & Syarat",
      intro: "Terma ini terpakai untuk aplikasi Tasneem oleh JalalDevs.",
      iapTitle: "Pembelian Dalam Aplikasi",
      iapBody: "Aplikasi menawarkan langganan auto-pembaharuan.",
      importantTitle: "Syarat Penting",
      importantBody: "Jika aplikasi dialih keluar dari kedai, anda boleh terus memperbaharui langganan anda dan dicaj, tetapi jika anda menyahpasangnya walaupun di tengah-tengah langganan anda tidak akan dapat memasangnya semula. Jadi anda bersetuju untuk membayar tawaran bulanan dengan kami, Tasneem App."
    }
  },
  maltese: {
    privacyModal: {
      title: "Politika ta' Privatezza",
      intro: "Din il-Politika tispjega kif Tasneem tipproteġi l-informazzjoni tiegħek.",
      permissionsTitle: "Permessi",
      permissionsBody: "L-app tista' titlob aċċess għall-post u notifiki.",
      dataTitle: "Dejta",
      dataBody: "Aħna ma niġbrux informazzjoni tal-karta tal-ħlas tiegħek.",
      thirdPartyTitle: "Parti Terza",
      thirdPartyBody: "L-app tuża RevenueCat biex timmaniġġja l-abbonamenti."
    },
    termsModal: {
      title: "Termini u Kundizzjonijiet",
      intro: "Dawn it-Termini japplikaw għall-applikazzjoni Tasneem.",
      iapTitle: "Xiri In-App",
      iapBody: "L-app toffri abbonamenti.",
      importantTitle: "Kundizzjoni Importanti",
      importantBody: "Jekk l-app titneħħa mill-maħżen, tista' tkompli ġġedded l-abbonament tiegħek, iżda jekk tneħħiha mhux se tkun tista' terġa' tinstallaha. Allura taqbel li tħallas għal ftehim fix-xahar magħna, Tasneem App."
    }
  },
  nepali: {
    privacyModal: {
      title: "गोपनीयता नीति",
      intro: "यो नीतिले तस्नीमले तपाईंको जानकारी कसरी सुरक्षित गर्छ भनेर बताउँछ।",
      permissionsTitle: "अनुमतिहरू",
      permissionsBody: "अनुप्रयोगले स्थान पहुँच अनुरोध गर्न सक्छ।",
      dataTitle: "डाटा",
      dataBody: "हामी तपाईंको भुक्तानी कार्ड जानकारी सङ्कलन गर्दैनौं।",
      thirdPartyTitle: "तेस्रो पक्ष",
      thirdPartyBody: "अनुप्रयोगले RevenueCat प्रयोग गर्दछ।"
    },
    termsModal: {
      title: "नियम र सर्तहरू",
      intro: "यी सर्तहरू तस्नीम अनुप्रयोगमा लागू हुन्छन्।",
      iapTitle: "इन-एप खरिदहरू",
      iapBody: "एपले सदस्यता प्रदान गर्दछ।",
      importantTitle: "महत्त्वपूर्ण सर्त",
      importantBody: "यदि एप स्टोरबाट हटाइयो भने, तपाइँ आफ्नो सदस्यता नवीकरण गर्न जारी राख्न सक्नुहुन्छ, तर यदि तपाइँ यसलाई अनइन्स्टल गर्नुभयो भने तपाइँ यसलाई फेरि स्थापना गर्न सक्षम हुनुहुने छैन। त्यसैले तपाइँ हामीसँग मासिक सम्झौताको लागि भुक्तान गर्न सहमत हुनुहुन्छ, तस्नीम एप।"
    }
  },
  norwegian: {
    privacyModal: {
      title: "Personvernerklæring",
      intro: "Denne personvernerklæringen forklarer hvordan Tasneem beskytter informasjonen din.",
      permissionsTitle: "Tillatelser",
      permissionsBody: "Appen kan be om tilgang til plassering og varsler.",
      dataTitle: "Data",
      dataBody: "Vi samler ikke inn betalingskortinformasjonen din.",
      thirdPartyTitle: "Tredjepart",
      thirdPartyBody: "Appen bruker RevenueCat til å administrere abonnementer."
    },
    termsModal: {
      title: "Vilkår og Betingelser",
      intro: "Disse vilkårene gjelder for Tasneem-applikasjonen.",
      iapTitle: "Kjøp i Appen",
      iapBody: "Appen tilbyr automatisk fornybare abonnementer.",
      importantTitle: "Viktig Betingelse",
      importantBody: "Hvis appen fjernes fra butikken, kan du fortsette å fornye abonnementet ditt og bli belastet, men hvis du avinstallerer den, vil du ikke kunne installere den igjen. Så du godtar å betale for en månedlig avtale med oss, Tasneem App."
    }
  },
  persian: {
    privacyModal: {
      title: "حریم خصوصی",
      intro: "این سیاست توضیح می‌دهد که تسنیم چگونه از اطلاعات شما محافظت می‌کند.",
      permissionsTitle: "مجوزها",
      permissionsBody: "برنامه ممکن است درخواست دسترسی به مکان را داشته باشد.",
      dataTitle: "داده‌ها",
      dataBody: "ما اطلاعات کارت پرداخت شما را ذخیره نمی‌کنیم.",
      thirdPartyTitle: "شخص ثالث",
      thirdPartyBody: "برنامه از RevenueCat استفاده می‌کند."
    },
    termsModal: {
      title: "شرایط و ضوابط",
      intro: "این شرایط برای برنامه تسنیم اعمال می‌شود.",
      iapTitle: "خریدهای درون برنامه‌ای",
      iapBody: "برنامه اشتراک‌های قابل تمدید خودکار ارائه می‌دهد.",
      importantTitle: "شرط مهم",
      importantBody: "اگر برنامه از فروشگاه حذف شود، می‌توانید تمدید اشتراک خود را ادامه دهید و هزینه از شما کسر شود، اما اگر آن را لغو نصب کنید، دیگر نمی‌توانید آن را نصب کنید. بنابراین شما موافقت می‌کنید که برای یک قرارداد ماهانه با ما، برنامه تسنیم پرداخت کنید."
    }
  },
  polish: {
    privacyModal: {
      title: "Polityka Prywatności",
      intro: "Ta polityka wyjaśnia, w jaki sposób Tasneem chroni Twoje informacje.",
      permissionsTitle: "Uprawnienia",
      permissionsBody: "Aplikacja może prosić o dostęp do lokalizacji i powiadomień.",
      dataTitle: "Dane",
      dataBody: "Nie zbieramy informacji o karcie płatniczej.",
      thirdPartyTitle: "Osoby trzecie",
      thirdPartyBody: "Aplikacja korzysta z RevenueCat do zarządzania subskrypcjami."
    },
    termsModal: {
      title: "Regulamin",
      intro: "Niniejsze Warunki dotyczą aplikacji Tasneem.",
      iapTitle: "Zakupy i subskrypcje",
      iapBody: "Aplikacja oferuje subskrypcje.",
      importantTitle: "Ważny Warunek",
      importantBody: "Jeśli aplikacja zostanie usunięta ze sklepu, możesz kontynuować odnawianie subskrypcji i pobieranie opłat, ale jeśli ją odinstalujesz, nie będziesz mógł zainstalować jej ponownie. Więc zgadzasz się płacić za miesięczną umowę z nami, aplikacją Tasneem."
    }
  },
  filipino: {
    privacyModal: {
      title: "Patakaran sa Pagkapribado",
      intro: "Ipinapaliwanag ng Patakaran sa Pagkapribado na ito kung paano pinoprotektahan ng Tasneem ang iyong impormasyon.",
      permissionsTitle: "Mga Pahintulot",
      permissionsBody: "Maaaring humiling ang App ng access sa lokasyon at mga notification upang mapabuti ang serbisyo.",
      dataTitle: "Data",
      dataBody: "Hindi kami nangongolekta o nag-iimbak ng impormasyon ng iyong card sa pagbabayad.",
      thirdPartyTitle: "Ikatlong Partido",
      thirdPartyBody: "Ginagamit ng App ang RevenueCat upang pamahalaan ang mga subscription."
    },
    termsModal: {
      title: "Mga Tuntunin at Kundisyon",
      intro: "Nalalapat ang mga Tuntuning ito sa Tasneem application ng JalalDevs.",
      iapTitle: "Mga In-App na Pagbili at Subscription",
      iapBody: "Nag-aalok ang App ng mga awtomatikong nababagong subscription.",
      importantTitle: "Mahalagang Kundisyon",
      importantBody: "Kung aalisin ang app mula sa tindahan, maaari kang magpatuloy sa pag-renew ng iyong subscription at masingil, ngunit kung ia-uninstall mo ito hindi mo na ito mai-install muli. Kaya sumasang-ayon kang magbayad para sa isang buwanang deal sa amin, Tasneem App."
    }
  },
  romanian: {
    privacyModal: {
      title: "Politica de Confidențialitate",
      intro: "Această politică explică modul în care Tasneem vă protejează informațiile.",
      permissionsTitle: "Permisiuni",
      permissionsBody: "Aplicația poate solicita acces la locație și notificări.",
      dataTitle: "Date",
      dataBody: "Nu colectăm și nu stocăm informațiile cardului dvs.",
      thirdPartyTitle: "Terți",
      thirdPartyBody: "Aplicația folosește RevenueCat pentru a gestiona abonamentele."
    },
    termsModal: {
      title: "Termeni și Condiții",
      intro: "Acești Termeni se aplică aplicației Tasneem.",
      iapTitle: "Achiziții în aplicație",
      iapBody: "Aplicația oferă abonamente auto-reînnoibile.",
      importantTitle: "Condiție Importantă",
      importantBody: "Dacă aplicația este eliminată din magazin, puteți continua să vă reînnoiți abonamentul, dar dacă o dezinstalați nu o veți mai putea instala din nou. Deci, sunteți de acord să plătiți pentru o ofertă lunară cu noi, aplicația Tasneem."
    }
  },
  dutch: {
    privacyModal: {
      title: "Privacybeleid",
      intro: "Dit privacybeleid legt uit hoe Tasneem uw gegevens beschermt.",
      permissionsTitle: "Toestemmingen",
      permissionsBody: "De app kan toegang vragen tot locatie en meldingen.",
      dataTitle: "Gegevens",
      dataBody: "Wij verzamelen of bewaren uw betaalkaartgegevens niet.",
      thirdPartyTitle: "Derden",
      thirdPartyBody: "De app gebruikt RevenueCat voor abonnementen."
    },
    termsModal: {
      title: "Algemene Voorwaarden",
      intro: "Deze voorwaarden zijn van toepassing op de Tasneem-app.",
      iapTitle: "In-app aankopen",
      iapBody: "De app biedt automatisch verlengbare abonnementen.",
      importantTitle: "Belangrijke Voorwaarde",
      importantBody: "Als de app uit de winkel wordt verwijderd, kunt u doorgaan met het verlengen van uw abonnement, maar als u deze verwijdert, kunt u deze niet opnieuw installeren. U gaat er dus mee akkoord te betalen voor een maandelijkse deal met ons, Tasneem App."
    }
  },
  slovak: {
    privacyModal: {
      title: "Zásady ochrany osobných údajov",
      intro: "Tieto zásady vysvetľujú, ako Tasneem chráni vaše informácie.",
      permissionsTitle: "Povolenia",
      permissionsBody: "Aplikácia môže požiadať o prístup k polohe a upozorneniam.",
      dataTitle: "Údaje",
      dataBody: "Nezhromažďujeme informácie o vašej platobnej karte.",
      thirdPartyTitle: "Tretie strany",
      thirdPartyBody: "Aplikácia využíva RevenueCat na správu predplatného."
    },
    termsModal: {
      title: "Podmienky",
      intro: "Tieto Podmienky sa vzťahujú na aplikáciu Tasneem.",
      iapTitle: "Nákupy v aplikácii",
      iapBody: "Aplikácia ponúka automaticky obnoviteľné predplatné.",
      importantTitle: "Dôležitá Podmienka",
      importantBody: "Ak bude aplikácia odstránená z obchodu, môžete pokračovať v obnove predplatného a budú vám účtované poplatky, ale ak ju odinštalujete, nebudete ju môcť znova nainštalovať. Súhlasíte teda, že nám budete platiť za mesačnú dohodu s nami, Tasneem App."
    }
  },
  somali: {
    privacyModal: {
      title: "Siyaasadda Khaaska ah",
      intro: "Siyaasaddan Khaaska ah waxay sharxaysaa sida Tasneem u ilaaliso xogtaada.",
      permissionsTitle: "Oggolaanshaha",
      permissionsBody: "App-ka waxaa laga yaabaa inuu codsado gelitaanka goobta iyo ogeysiisyada.",
      dataTitle: "Xogta",
      dataBody: "Ma ururino macluumaadka kaarka lacag bixintaada.",
      thirdPartyTitle: "Saddexaad",
      thirdPartyBody: "App-ka wuxuu isticmaalaa RevenueCat si uu u maareeyo rukumada."
    },
    termsModal: {
      title: "Shuruudaha & Xeerarka",
      intro: "Shuruudahani waxay khuseeyaan barnaamijka Tasneem.",
      iapTitle: "Iibka & Rukumada",
      iapBody: "App-ku wuxuu bixiyaa rukummo toos ah.",
      importantTitle: "Xaalad Muhiim ah",
      importantBody: "Haddii app-ka laga saaro dukaanka, waad sii wadan kartaa cusboonaysiinta rukunkaaga oo lagu soo dalaci doonaa, laakiin haddii aad ka saarto xitaa dhex-dhexaadinta ma awoodi doontid inaad dib u rakibto. Markaa waxaad ogolaatay inaad nala bixiso heshiis bishii, Tasneem App."
    }
  },
  swedish: {
    privacyModal: {
      title: "Integritetspolicy",
      intro: "Denna integritetspolicy förklarar hur Tasneem skyddar din information.",
      permissionsTitle: "Behörigheter",
      permissionsBody: "Appen kan begära åtkomst till plats och meddelanden.",
      dataTitle: "Data",
      dataBody: "Vi samlar inte in din betalkortsinformation.",
      thirdPartyTitle: "Tredje part",
      thirdPartyBody: "Appen använder RevenueCat för att hantera prenumerationer."
    },
    termsModal: {
      title: "Villkor",
      intro: "Dessa villkor gäller för Tasneem-applikationen.",
      iapTitle: "Köp i appen",
      iapBody: "Appen erbjuder automatiskt förnybara prenumerationer.",
      importantTitle: "Viktigt Villkor",
      importantBody: "Om appen tas bort från butiken kan du fortsätta att förnya din prenumeration, men om du avinstallerar den kommer du inte att kunna installera den igen. Så du går med på att betala för ett månatligt avtal med oss, Tasneem App."
    }
  },
  turkish: {
    privacyModal: {
      title: "Gizlilik Politikası",
      intro: "Bu Gizlilik Politikası, Tasneem'in bilgilerinizi nasıl koruduğunu açıklar.",
      permissionsTitle: "İzinler",
      permissionsBody: "Uygulama, hizmeti iyileştirmek için konuma erişim isteyebilir.",
      dataTitle: "Veri",
      dataBody: "Ödeme kartı bilgilerinizi toplamıyor veya saklamıyoruz.",
      thirdPartyTitle: "Üçüncü Taraf",
      thirdPartyBody: "Uygulama, abonelikleri yönetmek için RevenueCat kullanır."
    },
    termsModal: {
      title: "Şartlar ve Koşullar",
      intro: "Bu Şartlar, JalalDevs tarafından sağlanan Tasneem uygulaması için geçerlidir.",
      iapTitle: "Uygulama İçi Satın Alımlar",
      iapBody: "Uygulama, otomatik yenilenebilir abonelikler sunar.",
      importantTitle: "Önemli Koşul",
      importantBody: "Uygulama mağazadan kaldırılırsa, aboneliğinizi yenilemeye ve ücretlendirilmeye devam edebilirsiniz, ancak aboneliğin ortasında bile kaldırırsanız tekrar yükleyemezsiniz. Yani bizimle aylık bir anlaşma ödemeyi kabul ediyorsunuz, Tasneem App."
    }
  },
  uzbek: {
    privacyModal: {
      title: "Maxfiylik siyosati",
      intro: "Tasneem ma'lumotlaringizni qanday himoya qilishini tushuntiradi.",
      permissionsTitle: "Ruxsatlar",
      permissionsBody: "Ilova joylashuv va bildirishnomalarga kirishni so'rashi mumkin.",
      dataTitle: "Ma'lumotlar",
      dataBody: "Biz to'lov kartangiz ma'lumotlarini saqlamaymiz.",
      thirdPartyTitle: "Uchinchi tomon",
      thirdPartyBody: "Obunalarni boshqarish uchun RevenueCat-dan foydalaniladi."
    },
    termsModal: {
      title: "Shartlar",
      intro: "Ushbu Shartlar Tasneem ilovasi uchun qo'llaniladi.",
      iapTitle: "Xaridlar va obunalar",
      iapBody: "Ilova avtomatik yangilanadigan obunalarni taklif qiladi.",
      importantTitle: "Muhim Shart",
      importantBody: "Agar ilova do'kondan olib tashlansa, siz obunani yangilashni davom ettirishingiz va haq olinishingiz mumkin, ammo agar uni o'chirib tashlasangiz, uni qayta o'rnata olmaysiz. Shunday qilib, siz Tasneem ilovasi bilan oylik shartnoma uchun to'lashga rozilik bildirasiz."
    }
  },
  finnish: {
    privacyModal: {
      title: "Tietosuojakäytäntö",
      intro: "Tämä tietosuojakäytäntö selittää, kuinka Tasneem suojaa tietojasi.",
      permissionsTitle: "Luvat",
      permissionsBody: "Sovellus voi pyytää pääsyä sijaintiin ja ilmoituksiin.",
      dataTitle: "Tiedot",
      dataBody: "Emme kerää tai tallenna maksukorttitietojasi.",
      thirdPartyTitle: "Kolmas osapuoli",
      thirdPartyBody: "Sovellus käyttää RevenueCatia tilausten hallintaan."
    },
    termsModal: {
      title: "Käyttöehdot",
      intro: "Näitä ehtoja sovelletaan Tasneem-sovellukseen.",
      iapTitle: "Sovelluksen sisäiset ostot",
      iapBody: "Sovellus tarjoaa automaattisesti uusiutuvia tilauksia.",
      importantTitle: "Tärkeä Ehto",
      importantBody: "Jos sovellus poistetaan kaupasta, voit jatkaa tilauksesi uusimista, mutta jos poistat sen asennuksen, et voi asentaa sitä uudelleen. Hyväksyt siis maksavasi kuukausittaisen sopimuksen kanssamme, Tasneem App."
    }
  },
  tamil: {
    privacyModal: {
      title: "தனியுரிமைக் கொள்கை",
      intro: "இந்தக் கொள்கை உங்கள் தகவல்களை தஸ்நீம் எவ்வாறு பாதுகாக்கிறது என்பதை விளக்குகிறது.",
      permissionsTitle: "அனுமதிகள்",
      permissionsBody: "சேவையை மேம்படுத்த ஆப்ஸ் இருப்பிடம் மற்றும் அறிவிப்புகளுக்கான அணுகலைக் கோரலாம்.",
      dataTitle: "தரவு",
      dataBody: "நாங்கள் உங்கள் கட்டண அட்டை தகவல்களைச் சேகரிக்கவோ சேமிக்கவோ மாட்டோம்.",
      thirdPartyTitle: "மூன்றாம் தரப்பு",
      thirdPartyBody: "சந்தாக்களை நிர்வகிக்க ஆப்ஸ் RevenueCat ஐப் பயன்படுத்துகிறது."
    },
    termsModal: {
      title: "விதிமுறைகள்",
      intro: "இந்த விதிமுறைகள் தஸ்நீம் பயன்பாட்டிற்குப் பொருந்தும்.",
      iapTitle: "சந்தாக்கள்",
      iapBody: "ஆப்ஸ் தானாகப் புதுப்பிக்கக்கூடிய சந்தாக்களை வழங்குகிறது.",
      importantTitle: "முக்கியமான நிபந்தனை",
      importantBody: "ஆப்ஸ் ஸ்டோரிலிருந்து அகற்றப்பட்டால், உங்கள் சந்தாவைப் புதுப்பிப்பதைத் தொடரலாம் மற்றும் கட்டணம் வசூலிக்கப்படலாம், ஆனால் நீங்கள் அதை அன்இன்ஸ்டால் செய்தால் மீண்டும் நிறுவ முடியாது. எனவே எங்களுடன் மாதாந்திர ஒப்பந்தத்திற்கு பணம் செலுத்த ஒப்புக்கொள்கிறீர்கள், Tasneem App."
    }
  }
};

fileContent = fileContent.replace(/^(const \w+ = \{)([\r\n]+)/gm, (match, p1, p2) => {
  const langMatch = p1.match(/^const (\w+) = \{/);
  if (!langMatch) return match;
  const lang = langMatch[1];
  const t = translations[lang] || translations['english'];
  const injection = `  "privacyModal": ${JSON.stringify(t.privacyModal, null, 4).replace(/\n/g, '\n  ')},
  "termsModal": ${JSON.stringify(t.termsModal, null, 4).replace(/\n/g, '\n  ')},`;
  return p1 + p2 + injection + p2;
});

fs.writeFileSync(targetFile, fileContent, 'utf8');
console.log('Done inserting privacyModal and termsModal into appTranslations.js');
