/**
 * 外部配置文件
 * index.html 中可以搜索 EZ 将其替换为您的网站名称
 * logo 摆放位置为 images/logo.png
 */

export const config = {
  // 面板类型配置 - 请选择您使用的面板类型
  PANEL_TYPE: "Xiao-V2board", // 当前仅适配 Xiao-V2board
  // 说明:
  // 当前实现仅面向 Xiao-V2board 面板

  // =======================================================

  // API配置
  // 可使用以下选项来配置API基础URL:
  // 1. 静态URL: 直接指定API基础URL 末尾要加 /api/v1 !!!!!!!!!!!!!!! 除非你自己改过路由要不然别不加
  // 2. 自动获取: 从当前域名自动生成API基础URL
  API_CONFIG: {
    // API URL获取方式: 'static'=使用静态URL, 'auto'=自动从当前域名获取
    urlMode: "static",

    // 是否展示后端联通性检测
    showCheckBackend: false,

    // 静态URL模式下的基础URL (urlMode = 'static'时使用)
    // 支持字符串形式(单个API地址)或数组形式(多个备选API地址)
    // 多个地址时，会按顺序检测可用性，并使用第一个可用的地址
    staticBaseUrl: [
      "https://ai.adanalytics-service.com/api/v1",
    ],

    // 自动获取模式配置 (urlMode = 'auto'时使用)
    autoConfig: {
      // 是否使用相同协议 (http/https)
      useSameProtocol: true,

      // 是否拼接API路径
      appendApiPath: true,

      // API路径
      apiPath: "/api/v1",
    },
  },
  // ====================  网站基础配置  ====================
  SITE_CONFIG: {
    siteName: "EZ THEME",
    siteDescription: "EZ UI",
    // copyright会自动使用当前年份
    copyright: `© ${new Date().getFullYear()} EZ THEME. All Rights Reserved.`,

    // 是否显示标题中的网站Logo (true=显示, false=隐藏)
    showLogo: true,

    // 登录后页面背景图文件名（优先 src/assets/images/background，其次 public/images/background）
    // 例如: 'dashboard-bg.jpg'。也支持直接填写完整 URL。留空或文件不存在时保持默认样式。
    postLoginBackgroundImage: '',

    // Landing页面多语言标语
    landingText: {
      "zh-CN": "探索全球网络无限可能",
      "vi-VN": "Khám phá khả năng vô hạn của mạng toàn cầu",
      "en-US": "Explore Unlimited Possibilities of Global Network",
      "zh-TW": "探索全球網絡無限可能",
      "ja-JP": "グローバルネットワークの無限の可能性",
      "ko-KR": "글로벌 네트워크의 무한한 가능성을 탐색하세요",
      "ru-RU": "Исследуйте безграничные возможности глобальной сети",
      "fa-IR": "امکانات نامحدود شبکه جهانی را کاوش کنید",
    },

    // 自定义landing页面路径（相对于public目录
    // 例如：'testlandingpage.html'
    // 如果为空则不启用自定义landing页面
    customLandingPage: "",
  },

  // 默认主题配置
  DEFAULT_CONFIG: {
    // 主题色 (16进制颜色值)
    primaryColor: "#355cc2",

    // 是否启用落地页 (true=启用, false=禁用)
    enableLandingPage: true, // 默认启用
  },

  // 认证页面功能配置
  AUTH_CONFIG: {
    // 是否自动勾选同意条款复选框 (true=自动勾选, false=默认不勾选)
    autoAgreeTerms: true,

    // 验证码相关配置
    verificationCode: {
      // 是否在发送验证码后显示检查垃圾邮件的提示 (true=显示, false=不显示)
      showCheckSpamTip: true,

      // 显示检查垃圾邮件提示的延迟时间(毫秒)
      checkSpamTipDelay: 1000,
    },

    // 认证页面弹窗公告配置
    popup: {
      // 是否启用弹窗
      enabled: false,

      // 弹窗标题
      title: "用户须知 (可自定义开启)",

      // 弹窗内容 (支持HTML)
      content:
        "<p><strong>欢迎使用我们的服务！</strong></p><p>请注意以下事项：</p><ul><li>请妥善保管您的账号信息</li><li>如有问题请联系客服</li></ul>",

      // 冷却时间（小时），在此时间内不会再次显示弹窗
      cooldownHours: 0,

      // 等待时间（秒），用户需要等待多少秒才能关闭弹窗，设为0表示无需等待
      closeWaitSeconds: 3,
    },
  },

  // 认证页面布局配置
  AUTH_LAYOUT_CONFIG: {
    // 布局类型: 'center' 为居中卡片布局, 'split' 为左右分栏布局
    layoutType: "center",

    // 左右分栏布局配置 (仅当 layoutType 为 'split' 时生效)
    splitLayout: {
      // 左侧区域内容配置
      leftContent: {
        // 左侧背景图片URL或路径 (如不设置则不设置图片背景)
        backgroundImage: "https://www.loliapi.com/acg",

        // 左上角网站名称配置
        siteName: {
          // 是否显示网站名称
          show: true,
          // 文字颜色 (white或black)
          color: "white",
        },

        // 左下角问候语配置
        greeting: {
          // 是否显示问候语
          show: true,
          // 文字颜色 (white或black)
          color: "white",
        },
      },
    },
  },

  // 商店页面配置
  SHOP_CONFIG: {
    // 是否在商店导航上显示热销标记
    showHotSaleBadge: false,

    // 是否显示订阅特性卡片 (true=显示, false=隐藏)
    showPlanFeatureCards: true, // 默认显示

    // 是否自动选择周期最大的标签，设为false则不会自动选择
    autoSelectMaxPeriod: false, // 默认关闭

    // 是否隐藏周期选择标签 (true=隐藏, false=显示)
    hidePeriodTabs: false, // 默认显示周期选择标签

    // 库存紧张的阈值（当库存数量小于等于此值且大于0时显示库存紧张）
    lowStockThreshold: 5,

    // 是否启用周期折扣计算显示 (true=启用, false=禁用)
    enableDiscountCalculation: true, // 默认启用

    // 价格周期的显示顺序（从大到小）
    periodOrder: [
      "three_year_price", // 三年
      "two_year_price", // 两年
      "year_price", // 一年
      "half_year_price", // 半年
      "quarter_price", // 季度
      "month_price", // 月付
      "onetime_price", // 一次性
    ],
  },

  // 仪表盘页面配置
  DASHBOARD_CONFIG: {
    // 当前出口 IP 卡片：地区徽记颜色映射（国家/地区代码 -> 徽记色）
    ipRegionBadgeByCountryCode: {
      US: 'is-blue',
      CA: 'is-blue',
      NL: 'is-blue',
      HK: 'is-pink',
      SG: 'is-pink',
      JP: 'is-red',
      KR: 'is-red',
      DE: 'is-red',
      CN: 'is-red',
    },
  },

  // 客户端下载配置
  CLIENT_CONFIG: {
    // 平台显示控制 (true=显示, false=隐藏)
    showIOS: true,
    showAndroid: true,
    showMacOS: true,
    showWindows: true,

    // 客户端下载/文档链接（会在新标签页打开）
    clientLinks: {
      ios: "https://apps.apple.com/app/xxx",
      android: "https://play.google.com/store/apps/xxx",
      macos: "https://github.com/xxx/releases/latest",
      windows: "https://github.com/xxx/releases/latest",
    },

    // 快速开始页：各平台下载客户端（可自定义名称/地址/图标/是否推荐）
    // icon 可复用下方常见客户端键名；未匹配时前端会使用通用图标
    quickStartClients: {
      windows: [
        { name: 'FlClash', url: 'https://github.com/chen08209/FlClash/releases', icon: 'flclash', recommended: true },
        { name: 'Clash Verge', url: 'https://github.com/clash-verge-rev/clash-verge-rev/releases', icon: 'clashverge' },
        { name: 'sing-box 客户端', url: 'https://sing-box.sagernet.org/zh/clients/', icon: 'singbox-windows' }
      ],
      macos: [
        { name: 'FlClash', url: 'https://github.com/chen08209/FlClash/releases', icon: 'flclash', recommended: true },
        { name: 'Clash Verge', url: 'https://github.com/clash-verge-rev/clash-verge-rev/releases', icon: 'clashverge' },
        { name: 'Stash', url: 'https://stash.wiki/', icon: 'stash-mac' }
      ],
      android: [
        { name: 'FlClash', url: 'https://github.com/chen08209/FlClash/releases', icon: 'flclash', recommended: true },
        { name: 'ClashMeta for Android', url: 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases', icon: 'clash-meta-android' },
        { name: 'sing-box', url: 'https://sing-box.sagernet.org/zh/clients/', icon: 'singbox-android' }
      ],
      ios: [
        { name: 'Shadowrocket', url: 'https://apps.apple.com/app/shadowrocket/id932747118', icon: 'shadowrocket', recommended: true },
        { name: 'Stash', url: 'https://apps.apple.com/app/stash-rule-based-proxy/id1596063349', icon: 'stash-ios' },
        { name: 'Loon', url: 'https://apps.apple.com/app/loon/id1373567447', icon: 'loon' }
      ]
    },

    // 配置导入客户端显示控制 部分面板不支持SingBox导入请您注意检查

    // iOS平台
    showShadowrocket: true,
    showSurge: true,
    showStash: true,
    showQuantumultX: true,
    showHiddifyIOS: true,
    showSingboxIOS: true,
    showLoon: true,

    // Android平台客户端
    showFlClashAndroid: true,
    showV2rayNG: true,
    showClashAndroid: true,
    showSurfboard: true,
    showClashMetaAndroid: true,
    showNekobox: true,
    showSingboxAndroid: true,
    showHiddifyAndroid: true,

    // Windows平台客户端
    showFlClashWindows: true,
    showClashVergeWindows: true,
    showClashWindows: true,
    showNekoray: true,
    showSingboxWindows: true,
    showHiddifyWindows: true,

    // MacOS平台客户端
    showFlClashMac: true,
    showClashVergeMac: true,
    showClashX: true,
    showClashMetaX: true,
    showSurgeMac: true,
    showStashMac: true,
    showQuantumultXMac: true,
    showSingboxMac: true,
    showHiddifyMac: true,
  },

  // ================ Xiao 版本的配置 =======================

  // 用户中心页面配置
  PROFILE_CONFIG: {
    // 是否显示礼品卡兑换栏目 (true=显示, false=隐藏)
    showGiftCardRedeem: false, // 只有Xiao-V2board支持礼品卡兑换

    // 是否显示最近登录设备栏目 (true=显示, false=隐藏)
    showRecentDevices: true,
  },

  // =======================================================

  // 验证码配置
  CAPTCHA_CONFIG: {
    // 验证方式: 'google' 或 'cloudflare'
    captchaType: "google",

    // Google reCAPTCHA 配置 默认v2版本
    google: {
      // 验证API地址，可选，默认使用官方地址
      verifyUrl: "https://www.google.com/recaptcha/api/siteverify",
    },

    // Cloudflare Turnstile 配置
    cloudflare: {
      // 验证API地址，可选，默认使用官方地址
      verifyUrl: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    },
  },

  // 自定义请求标头配置
  // 可在此添加全局自定义标头，这些标头将被添加到所有API请求中，可以搭配防火墙做验证拦截不良请求
  // 如果会配置的话建议配置一下，不会就别动了
  CUSTOM_HEADERS: {
    // 是否启用自定义标头
    enabled: false, // 默认关闭，启用前请确保服务器已配置正确的CORS策略

    // ⚠️ CORS警告：添加自定义标头将触发浏览器的预检请求(OPTIONS)
    // 服务器必须在响应中包含Access-Control-Allow-Headers字段，并列出这些自定义标头
    // 如果您控制服务器，请确保在CORS配置中添加您的自定义标头名称
    // 例如: Access-Control-Allow-Headers: "Content-Type, Authorization, X-Custom-Header, test"

    // 自定义标头列表
    // 格式: { "标头名称": "标头值" }
    // 例如: { "X-Custom-Header": "CustomValue" }
    headers: {
      // "test": "test123"
    },
  },

  // =======================================================

  // 支付相关配置
  PAYMENT_CONFIG: {
    // 是否在新标签页打开支付链接 (true=新标签页打开, false=当前页面打开)
    openPaymentInNewTab: true, // 默认开启

    // 支付二维码大小 (像素)
    qrcodeSize: 200,

    // 支付二维码的颜色
    qrcodeColor: "#000000",

    // 支付二维码的背景色
    qrcodeBackground: "#ffffff",

    // 是否自动检测支付状态 (true=启用自动检测, false=手动检测)
    autoCheckPayment: true, // 默认启用

    // 自动检测支付状态的间隔时间 (毫秒)
    autoCheckInterval: 5000, // 默认5秒

    // 自动检测支付状态的最大次数 (设置为0表示无限次)
    autoCheckMaxTimes: 60, // 默认60次

    // 是否对Safari浏览器使用支付弹窗模式，而不是直接跳转 (true=使用弹窗, false=直接跳转)
    useSafariPaymentModal: true, // 默认开启

    // 是否自动选择第一个支付方式 (true=自动选择, false=需要用户手动选择)
    // 开启后，用户进入支付页面时将自动选择列表中的第一个支付方式，无需手动点击选择
    autoSelectFirstMethod: true, // 默认开启
  },

  // 充值相关配置
  WALLET_CONFIG: {
    // 预设充值金额选项（单位：元）
    presetAmounts: [20, 50, 100, 200],

    // 默认选中的充值金额（如果设为null则不预选金额）
    defaultSelectedAmount: null,

    // 最小充值金额（单位：元）
    minimumDepositAmount: 1,
  },

  // =======================================================

  // 邀请页面配置
  INVITE_CONFIG: {
    // 是否在导航栏的邀请按钮上显示返利标记
    showCommissionBadge: false,

    // 返佣记录每页显示数量（最小值为10，API限制每次请求最少需要返回10条记录）
    recordsPerPage: 10,

    // 邀请链接配置
    inviteLinkConfig: {
      // 链接模式：'auto'=自动使用当前站点域名，'custom'=使用自定义域名
      linkMode: "auto",
      // 自定义域名，当linkMode为'custom'时使用
      customDomain: "https://example.com",
    },
  },

  // =======================================================

  // 浏览器访问限制配置
  BROWSER_RESTRICT_CONFIG: {
    // 是否启用浏览器限制功能
    enabled: true,

    // 各浏览器是否被限制访问（true=限制访问，false=允许访问）
    restrictBrowsers: {
      360: true, // 360浏览器
      QQ: true, // QQ浏览器
      WeChat: true, // 微信内置浏览器
      Baidu: true, // 百度浏览器
      Sogou: true, // 搜狗浏览器
      UC: false, // UC浏览器
      Maxthon: false, // 傲游浏览器
    },

    // 推荐下载的浏览器链接
    recommendedBrowsers: {
      Chrome: "https://www.google.cn/chrome/",
      Edge: "https://www.microsoft.com/edge",
    },
  },

  // 工单配置
  TICKET_CONFIG: {
  },

  // 流量明细配置
  TRAFFICLOG_CONFIG: {
    // 是否启用流量明细页面 (true=启用, false=禁用)
    enableTrafficLog: true, // 默认启用

    //是否启用流量明表格 (true=启用, false=禁用）
    showTrafficTable: true, // 默认启用

    // 显示多少天的流量记录
    daysToShow: 30, // 默认显示30天

    // 流量趋势图是否聚合每日流量 (如果你的节点倍率全为1倍则无需开启)
    sumDailyTraffic: false, // 默认禁用
  },

  // 节点列表配置
  NODES_CONFIG: {
    // 是否显示节点倍率 (true=显示, false=隐藏，若此处为false则allowViewNodeInfo也会为false)
    showNodeRate: true,

    // 是否显示节点详细信息（主机和端口）
    showNodeDetails: false,

    // 是否允许查看节点详细信息（控制详情按钮和模态框）
    allowViewNodeInfo: true,
  },

  // 导航配置（已迁移为固定四项：概览/区域/使用/账号）
  NAVIGATION_CONFIG: {
    // 废弃：thirdNavItem/fourthNavItem 不再参与侧边导航生成，仅保留兼容字段避免旧配置报错
    // thirdNavItem: "invite",
    // fourthNavItem: "docs",
  },


};

window.EZ_CONFIG = config;
