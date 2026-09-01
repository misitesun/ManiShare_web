export const zhCN = {
  navigation: {
    foundation: '基础框架',
  },
  layout: {
    productType: '英语学习平台',
    framework: '多端应用基础框架',
    rendererScope: 'PC · 平板 · 移动 H5 · Electron',
    p0Status: 'P0 基础能力',
    mainNavigation: '主导航',
    interfaceSettings: '界面设置',
    openNavigation: '打开导航',
    closeNavigation: '关闭导航',
    homeLabel: '返回 {{appName}} 首页',
    language: '界面语言',
    theme: '主题',
    loading: '正在加载基础框架…',
  },
  theme: {
    dark: '深色',
    light: '浅色',
  },
  foundation: {
    eyebrow: 'P0 / FOUNDATION',
    title: '英语学习产品的多端基础框架已经就位',
    description: '当前只完成应用壳层、Tailwind 响应式能力、黑白主题、界面语言与 Electron 共享边界，不实现课程、练习、笔记或用户档案等具体业务页面。',
    capabilities: {
      responsive: {
        title: 'Mobile-first 响应式',
        description: '手机使用抽屉导航，平板提升内容密度，PC 与 Electron 使用常驻侧栏；所有端共享同一套语义结构。',
      },
      themes: {
        title: '可扩展黑白主题',
        description: 'dark 与 light 拥有完整语义 token。组件只消费 Tailwind 主题类，后续可按同一契约增加新主题。',
      },
      architecture: {
        title: 'FSD 与安全桌面壳',
        description: '业务将按 FSD 分层扩展；Electron 保持隔离、沙箱和窄 preload/IPC 边界，不侵入 Web renderer。',
      },
    },
    scope: {
      title: '本阶段范围',
      description: '这是基础能力验收页，不代表最终首页或产品信息架构。首个学习业务模块确认后，再建立对应 page、feature 与 entity。',
    },
  },
  error: {
    eyebrow: '页面错误',
    title: '页面发生异常',
    unknown: '发生了未知错误。',
    backHome: '返回基础框架',
  },
} as const
