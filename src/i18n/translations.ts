export type LanguageCode = 'en' | 'ru' | 'tg';

export interface TranslationStrings {
  appName: string;
  tagline: string;
  nav: {
    dashboard: string;
    speedTest: string;
    optimization: string;
    dns: string;
    monitor: string;
    history: string;
    androidProject: string;
    settings: string;
  };
  truthBanner: {
    title: string;
    body: string;
  };
  dashboard: {
    connectionStatus: string;
    connected: string;
    disconnected: string;
    networkType: string;
    ipAddress: string;
    signalStrength: string;
    meteredStatus: string;
    meteredYes: string;
    meteredNo: string;
    boostButton: string;
    boosting: string;
    stages: {
      checkingConnection: string;
      testingDns: string;
      testingLatency: string;
      checkingNetwork: string;
      optimizingConnection: string;
      finalizing: string;
    };
    optimizationComplete: string;
    beforeAfterTitle: string;
    metric: string;
    before: string;
    after: string;
    honestNote: string;
  };
  speedTest: {
    title: string;
    subtitle: string;
    testButton: string;
    testing: string;
    download: string;
    upload: string;
    ping: string;
    jitter: string;
    appLatency: string;
    dnsLatency: string;
    distinctionTitle: string;
    distinctionSpeed: string;
    distinctionDns: string;
    distinctionLatency: string;
    distinctionApp: string;
  };
  dns: {
    title: string;
    subtitle: string;
    runBenchmark: string;
    running: string;
    fastestProvider: string;
    privateDnsTitle: string;
    privateDnsExplanation: string;
    copyHostname: string;
    copied: string;
    limitationNote: string;
  };
  optimization: {
    title: string;
    subtitle: string;
    mobileSection: string;
    apnAndMtuSection: string;
    backgroundSection: string;
    vpnSection: string;
    evidenceEngineTitle: string;
  };
  monitor: {
    title: string;
    subtitle: string;
    livePolling: string;
    pausePolling: string;
    intervalLabel: string;
    batteryNote: string;
  };
  history: {
    title: string;
    subtitle: string;
    clearHistory: string;
    exportJson: string;
    emptyState: string;
  };
  settings: {
    title: string;
    language: string;
    theme: string;
    lightMode: string;
    darkMode: string;
    permissionsTitle: string;
    securityTitle: string;
    aboutTitle: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationStrings> = {
  en: {
    appName: 'Internet Turbo TJ',
    tagline: 'Mobile Cellular Network (4G / 4G+ / 5G NR) Diagnostics & Optimizer',
    nav: {
      dashboard: 'Dashboard',
      speedTest: 'Speed Test',
      optimization: 'Cellular Boost',
      dns: 'DNS & VPN',
      monitor: 'Monitor',
      history: 'History',
      androidProject: 'Android Source',
      settings: 'Settings & About',
    },
    truthBanner: {
      title: 'Mobile Network Optimization Principle',
      body: 'No smartphone app can physically exceed the radio capacity of your mobile operator tower. Internet Turbo TJ maximizes your practical 4G / 4G+ / 5G mobile performance by accelerating cellular DNS resolution, warming HTTP/2 sockets, tuning cellular MTU/APN parameters, and halting background mobile data drain.',
    },
    dashboard: {
      connectionStatus: 'Mobile Data Status',
      connected: 'Cellular Active & Validated',
      disconnected: 'Mobile Data Offline',
      networkType: 'Cellular Radio',
      ipAddress: 'Carrier Client IP',
      signalStrength: 'Tower Signal (RSRP / SINR)',
      meteredStatus: 'Carrier Data Policy',
      meteredYes: 'Metered Mobile Plan',
      meteredNo: 'Unlimited Mobile Plan',
      boostButton: 'BOOST INTERNET',
      boosting: 'OPTIMIZING MOBILE NETWORK...',
      stages: {
        checkingConnection: 'Checking connection...',
        testingDns: 'Testing DNS...',
        testingLatency: 'Testing latency...',
        checkingNetwork: 'Checking network...',
        optimizingConnection: 'Optimizing connection...',
        finalizing: 'Finalizing...',
      },
      optimizationComplete: 'Internet Optimization Complete',
      beforeAfterTitle: 'Measured Mobile Network Before / After Comparison',
      metric: 'Cellular Metric',
      before: 'Before',
      after: 'After / Optimized',
      honestNote:
        'Physical cell tower bandwidth is governed by your SIM operator. Practical speed and responsiveness gains come from switching away from slow carrier DNS resolvers, warming cellular TCP/TLS sockets, and restricting background data competition.',
    },
    speedTest: {
      title: 'Mobile Network Throughput & Latency Test',
      subtitle:
        'Executes uncompressed binary cellular transfers and multi-sample RTT echo probes over 4G / 4G+ / 5G.',
      testButton: 'TEST INTERNET',
      testing: 'TESTING MOBILE DATA...',
      download: 'Mobile Download',
      upload: 'Mobile Upload',
      ping: 'Cellular Ping (Min RTT)',
      jitter: 'Cellular Jitter',
      appLatency: 'HTTP/App Latency',
      dnsLatency: 'DNS Lookup Time',
      distinctionTitle: 'Understanding Your 4 Mobile Network Metrics',
      distinctionSpeed:
        'Mobile Internet Speed (Mbps): Maximum data volume per second delivered by your 4G / 4G+ / 5G cell tower.',
      distinctionDns:
        'DNS Response Time (ms): How fast domain names translate into IP addresses before mobile apps or pages start loading.',
      distinctionLatency:
        'Cellular Latency / Ping (ms): Round-trip travel time of a packet between your smartphone modem and the server.',
      distinctionApp:
        'Application Latency (ms): Full TLS handshake + HTTP request-response turnaround over mobile data.',
    },
    dns: {
      title: 'Cellular DNS Benchmark & VpnService Local Tunnel',
      subtitle:
        'Replace sluggish mobile carrier DNS resolvers with the fastest verified Anycast DNS via Android Private DNS (DoT) or local VpnService.',
      runBenchmark: 'Benchmark DNS on Mobile Data',
      running: 'Testing Carrier vs Public DNS...',
      fastestProvider: 'Fastest Cellular Resolver',
      privateDnsTitle: 'Android 10–16 Private DNS (DNS-over-TLS) Setup',
      privateDnsExplanation:
        'Mobile operators often route DNS lookups through congested local resolvers. Configuring Android Private DNS (DoT) or activating the local VpnService tunnel bypasses slow carrier DNS lookups.',
      copyHostname: 'Copy DoT Hostname',
      copied: 'Copied to Clipboard',
      limitationNote:
        'Optimizing DNS eliminates domain lookup delays on 4G/5G networks, making apps and sites open faster without altering your SIM tariff bandwidth.',
    },
    optimization: {
      title: 'Mobile Cellular (4G / 4G+ / 5G NR) Optimization Engine',
      subtitle:
        'Real-time cellular radio diagnostics (RSRP, RSRQ, SINR, Carrier Aggregation), APN/MTU verification, and background mobile data control.',
      mobileSection: 'Cellular Radio & Tower Telemetry (4G / 4G+ / 5G NR)',
      apnAndMtuSection: 'Cellular APN, IPv4/IPv6 & MTU Packet Optimization',
      backgroundSection: 'Background Mobile Data Usage & Android Data Saver',
      vpnSection: 'Transparent VpnService Cellular DNS Tunnel',
      evidenceEngineTitle: 'Mobile Network Diagnostic Evaluations',
    },
    monitor: {
      title: 'Real-Time Mobile Data Monitor',
      subtitle:
        'Battery-conscious live cellular telemetry using Android TrafficStats.getMobileRxBytes() and NetworkCallback.',
      livePolling: 'Live Cellular Monitor Active',
      pausePolling: 'Monitoring Paused',
      intervalLabel: 'Polling Cadence',
      batteryNote:
        'Automatically pauses cellular radio polling when the screen turns off to prevent modem wake-locks and battery drain.',
    },
    history: {
      title: 'Mobile Network Performance History',
      subtitle:
        '100% offline-first storage (Room SQLite on Android) tracking 4G / 4G+ / 5G performance over time.',
      clearHistory: 'Clear History',
      exportJson: 'Export JSON Report',
      emptyState: 'No mobile speed tests recorded yet. Tap TEST INTERNET to record a baseline.',
    },
    settings: {
      title: 'Settings, Cellular Permissions & Technical Truth',
      language: 'Application Language',
      theme: 'Interface Theme',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      permissionsTitle: 'Android 10–16 Cellular Permission Transparency',
      securityTitle: 'Zero-Interception Security Architecture',
      aboutTitle: 'About Internet Turbo TJ (Mobile Network Edition)',
    },
  },
  ru: {
    appName: 'Internet Turbo TJ',
    tagline: 'Диагностика и ускорение мобильного интернета (4G / 4G+ / 5G NR)',
    nav: {
      dashboard: 'Главная',
      speedTest: 'Тест скорости',
      optimization: 'Мобильная сеть',
      dns: 'DNS и VPN',
      monitor: 'Мониторинг',
      history: 'История',
      androidProject: 'Код Android',
      settings: 'Настройки',
    },
    truthBanner: {
      title: 'Принцип оптимизации мобильной сети',
      body: 'Приложение не может физически изменить базовую станцию оператора. Internet Turbo TJ ускоряет отклик мобильного интернета 4G / 4G+ / 5G за счет замены медленного операторского DNS, прогрева TCP/TLS-сокетов, проверки MTU/APN и блокировки фонового расхода трафика.',
    },
    dashboard: {
      connectionStatus: 'Статус мобильной сети',
      connected: 'Мобильные данные активны',
      disconnected: 'Мобильная сеть недоступна',
      networkType: 'Режим радиомодуля',
      ipAddress: 'IP-адрес оператора',
      signalStrength: 'Сигнал вышки (RSRP / SINR)',
      meteredStatus: 'Тарификация SIM',
      meteredYes: 'Лимитный мобильный тариф',
      meteredNo: 'Безлимитный тариф',
      boostButton: 'BOOST INTERNET',
      boosting: 'ОПТИМИЗАЦИЯ МОБИЛЬНОЙ СЕТИ...',
      stages: {
        checkingConnection: 'Проверка мобильной сети...',
        testingDns: 'Тестирование DNS серверов...',
        testingLatency: 'Замер мобильного пинга...',
        checkingNetwork: 'Анализ сигнала 4G/4G+/5G...',
        optimizingConnection: 'Оптимизация мобильного соединения...',
        finalizing: 'Завершение...',
      },
      optimizationComplete: 'Оптимизация интернета завершена',
      beforeAfterTitle: 'Сравнение мобильной сети До / После',
      metric: 'Показатель мобильной сети',
      before: 'До',
      after: 'После / Оптимизировано',
      honestNote:
        'Максимальная пропускная способность зависит от базовой станции оператора. Ускорение достигается за счет быстрого DNS-отклика, пула сокетов и отключения фоновой нагрузки.',
    },
    speedTest: {
      title: 'Тест скорости мобильного интернета (4G / 4G+ / 5G)',
      subtitle:
        'Реальная передача бинарных потоков и точный замер пинга, джиттера и задержки мобильной сети.',
      testButton: 'TEST INTERNET',
      testing: 'ТЕСТ МОБИЛЬНОЙ СЕТИ...',
      download: 'Скачивание (Download)',
      upload: 'Загрузка (Upload)',
      ping: 'Пинг (Мин. RTT)',
      jitter: 'Джиттер (Колебание)',
      appLatency: 'Задержка HTTP',
      dnsLatency: 'Отклик DNS',
      distinctionTitle: 'Разница между 4 показателями мобильной сети',
      distinctionSpeed:
        'Скорость интернета (Мбит/с): Объем данных в секунду, передаваемый через базовую станцию 4G / 4G+ / 5G.',
      distinctionDns:
        'Время отклика DNS (мс): Скорость преобразования адреса сайта в IP перед началом загрузки в мобильной сети.',
      distinctionLatency:
        'Мобильная задержка / Пинг (мс): Время прохождения сигнала от модема телефона до сервера и обратно.',
      distinctionApp:
        'Прикладная задержка (мс): Полное время TLS-соединения и ответа сервера в мобильных приложениях.',
    },
    dns: {
      title: 'Мобильный DNS и локальный VpnService туннель',
      subtitle:
        'Замена медленных DNS мобильного оператора на быстрые серверы Cloudflare, Google и Quad9.',
      runBenchmark: 'Проверить скорость DNS',
      running: 'Тестирование DNS...',
      fastestProvider: 'Самый быстрый DNS для мобильной сети',
      privateDnsTitle: 'Настройка Персонального DNS (Android 10–16)',
      privateDnsExplanation:
        'DNS-серверы мобильных операторов часто перегружены в часы пик. Использование Private DNS (DoT) или прозрачного локального VPN-туннеля ускоряет открытие сайтов и приложений.',
      copyHostname: 'Скопировать DoT адрес',
      copied: 'Скопировано',
      limitationNote:
        'Быстрый DNS устраняет задержку перед открытием страниц в сетях 4G/5G, но не меняет тарифный лимит скорости оператора.',
    },
    optimization: {
      title: 'Оптимизатор мобильной сети (4G / 4G+ / 5G NR)',
      subtitle:
        'Анализ уровня сигнала базовой станции (RSRP, SINR), агрегации частот LTE-A (4G+), параметров APN/MTU и фонового трафика.',
      mobileSection: 'Радиомодуль и сигнал сотовой вышки (4G / 4G+ / 5G NR)',
      apnAndMtuSection: 'Оптимизация APN, IPv4/IPv6 и размера пакета MTU',
      backgroundSection: 'Фоновый расход мобильного трафика (Экономия данных)',
      vpnSection: 'Прозрачный локальный VPN-модуль DNS',
      evidenceEngineTitle: 'Диагностика и рекомендации для мобильной сети',
    },
    monitor: {
      title: 'Мониторинг мобильной сети в реальном времени',
      subtitle:
        'Отслеживание мобильного трафика через TrafficStats.getMobileRxBytes() и задержки сигнала без лишнего расхода батареи.',
      livePolling: 'Мониторинг активен',
      pausePolling: 'На паузе',
      intervalLabel: 'Интервал опроса',
      batteryNote:
        'Автоматически останавливает опрос модема при выключении экрана, чтобы не разряжать аккумулятор.',
    },
    history: {
      title: 'История замеров мобильной сети',
      subtitle:
        'Локальное хранение результатов 4G / 4G+ / 5G на устройстве (Room SQLite) без регистрации.',
      clearHistory: 'Очистить историю',
      exportJson: 'Экспорт отчета JSON',
      emptyState: 'Замеров мобильной сети пока нет. Запустите тест скорости.',
    },
    settings: {
      title: 'Настройки, разрешения и о программе',
      language: 'Язык интерфейса',
      theme: 'Тема оформления',
      lightMode: 'Светлая',
      darkMode: 'Темная',
      permissionsTitle: 'Разрешения Android 10–16 для мобильной сети',
      securityTitle: 'Безопасность и конфиденциальность',
      aboutTitle: 'О приложении Internet Turbo TJ (Мобильная версия)',
    },
  },
  tg: {
    appName: 'Internet Turbo TJ',
    tagline: 'Ташхис ва тезкунии интернети мобилӣ (4G / 4G+ / 5G NR)',
    nav: {
      dashboard: 'Асосӣ',
      speedTest: 'Санҷиши суръат',
      optimization: 'Шабакаи мобилӣ',
      dns: 'DNS ва VPN',
      monitor: 'Назорат',
      history: 'Таърих',
      androidProject: 'Коди Android',
      settings: 'Танзимот',
    },
    truthBanner: {
      title: 'Принсипи беҳтарсозии интернети мобилӣ',
      body: 'Ягон барнома наметавонад истгоҳи базавии оператори мобилиро физикӣ тағйир диҳад. Internet Turbo TJ кори амалии интернети мобилии 4G / 4G+ / 5G-ро тавассути интихоби DNS-и тезтар, танзими сокетҳо, санҷиши APN/MTU ва манъи трафики заминавӣ беҳтар мекунад.',
    },
    dashboard: {
      connectionStatus: 'Ҳолати интернети мобилӣ',
      connected: 'Интернети мобилӣ фаъол аст',
      disconnected: 'Шабакаи мобилӣ нест',
      networkType: 'Навъи шабакаи мобилӣ',
      ipAddress: 'Суроғаи IP-и оператор',
      signalStrength: 'Сигнали манора (RSRP / SINR)',
      meteredStatus: 'Сиёсати тарофаи SIM',
      meteredYes: 'Тарофаи лимитӣ (Мобилӣ)',
      meteredNo: 'Тарофаи белимит',
      boostButton: 'BOOST INTERNET',
      boosting: 'БЕҲТАРСОЗИИ ШАБАКАИ МОБИЛӢ...',
      stages: {
        checkingConnection: 'Санҷиши пайвасти мобилӣ...',
        testingDns: 'Санҷиши суръати DNS...',
        testingLatency: 'Санҷиши таъхир (Latency)...',
        checkingNetwork: 'Таҳлили сигнали 4G/4G+/5G...',
        optimizingConnection: 'Беҳтарсозии пайвасти мобилӣ...',
        finalizing: 'Анҷомёбӣ...',
      },
      optimizationComplete: 'Беҳтарсозии интернет анҷом ёфт',
      beforeAfterTitle: 'Муқоисаи шабакаи мобилӣ: Пеш / Баъд',
      metric: 'Нишондиҳандаи мобилӣ',
      before: 'Пеш',
      after: 'Баъд / Беҳтаршуда',
      honestNote:
        'Суръати тарофавӣ аз оператори мобилии шумо вобаста аст. Тезшавии кушодашавии сомонаҳо ва барномаҳо аз ҳисоби DNS-и тез ва кам кардани сарбории заминавӣ ба даст меояд.',
    },
    speedTest: {
      title: 'Санҷиши воқеии суръати интернети мобилӣ',
      subtitle:
        'Ченкунии дақиқи Download, Upload, Ping ва Jitter дар шабакаҳои 4G / 4G+ / 5G.',
      testButton: 'TEST INTERNET',
      testing: 'САНҶИШИ ИНТЕРНЕТИ МОБИЛӢ...',
      download: 'Боргирӣ (Download)',
      upload: 'Боркунӣ (Upload)',
      ping: 'Пинги мобилӣ (RTT)',
      jitter: 'Джиттер (Тағйирёбӣ)',
      appLatency: 'Таъхири HTTP',
      dnsLatency: 'Посухи DNS',
      distinctionTitle: 'Фарқияти 4 нишондиҳандаи шабакаи мобилӣ',
      distinctionSpeed:
        'Суръати интернети мобилӣ (Мбит/с): Ҳаҷми маълумот дар як сония аз манораи 4G / 4G+ / 5G.',
      distinctionDns:
        'Вақти посухи DNS (мс): Суръати табдили номи сомона ба IP пеш аз кушодашавии барнома.',
      distinctionLatency:
        'Таъхири шабака / Пинг (мс): Вақти рафтуомади сигнал байни модеми телефон ва сервер.',
      distinctionApp:
        'Таъхири барномавӣ (мс): Вақти пурраи пайвастшавии TLS ва посухи сервер дар интернети мобилӣ.',
    },
    dns: {
      title: 'Санҷиши DNS барои интернети мобилӣ ва VpnService',
      subtitle:
        'Иваз кардани DNS-и сусти оператори мобилӣ ба серверҳои тези Cloudflare, Google ва Quad9.',
      runBenchmark: 'Оғози санҷиши DNS',
      running: 'Санҷиши DNS идома дорад...',
      fastestProvider: 'Тезтарин DNS барои шабакаи мобилӣ',
      privateDnsTitle: 'Танзими Private DNS (Android 10–16)',
      privateDnsExplanation:
        'Серверҳои DNS-и операторҳои мобилӣ аксар вақт гаронбор мешаванд. Истифодаи Private DNS (DoT) ё реҷаи VpnService кушодашавии сомонаҳоро тезтар мекунад.',
      copyHostname: 'Нусхабардории суроғаи DoT',
      copied: 'Нусхабардорӣ шуд',
      limitationNote:
        'Иваз кардани DNS таъхири кушодашавии сомонаҳоро дар 4G/5G кам мекунад, вале суръати тарофавии боргириро зиёд намекунад.',
    },
    optimization: {
      title: 'Муҳаррики беҳтарсозии шабакаи мобилӣ (4G / 4G+ / 5G NR)',
      subtitle:
        'Таҳлили сигнали манораи алоқа (RSRP, SINR), агрегатсияи басомадҳо (4G+), танзимоти APN/MTU ва трафики заминавӣ.',
      mobileSection: 'Маълумоти радиомодул ва манораи мобилӣ (4G / 4G+ / 5G NR)',
      apnAndMtuSection: 'Беҳтарсозии APN, IPv4/IPv6 ва андозаи бастаҳои MTU',
      backgroundSection: 'Истифодаи заминавии интернети мобилӣ',
      vpnSection: 'Модули шаффофи VPN барои DNS-и мобилӣ',
      evidenceEngineTitle: 'Натиҷаи таҳлили шабакаи мобилӣ',
    },
    monitor: {
      title: 'Назорати интернети мобилӣ дар вақти воқеӣ',
      subtitle:
        'Назорати сарфакоронаи трафики мобилӣ тавассути Android TrafficStats ва NetworkCallback.',
      livePolling: 'Назорат фаъол аст',
      pausePolling: 'Боздошта шуд',
      intervalLabel: 'Фосилаи навсозӣ',
      batteryNote:
        'Ҳангоми хомӯш будани экран барои сарфаи заряди батарея худкор бозмеистад.',
    },
    history: {
      title: 'Таърихи санҷишҳои шабакаи мобилӣ',
      subtitle:
        'Нигоҳдории маҳаллӣ дар дастгоҳ (Room SQLite) барои муқоисаи кори 4G / 4G+ / 5G.',
      clearHistory: 'Пок кардани таърих',
      exportJson: 'Боргирии ҳисоботи JSON',
      emptyState: 'Ҳоло ягон санҷиш сабт нашудааст. Санҷиши суръатро оғоз кунед.',
    },
    settings: {
      title: 'Танзимот, иҷозатҳо ва маълумот',
      language: 'Забони барнома',
      theme: 'Намуди экран',
      lightMode: 'Равшан',
      darkMode: 'Торик',
      permissionsTitle: 'Иҷозатҳои Android 10–16 барои шабакаи мобилӣ',
      securityTitle: 'Амният ва махфият',
      aboutTitle: 'Дар бораи Internet Turbo TJ (Нашри мобилӣ)',
    },
  },
};
