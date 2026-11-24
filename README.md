# 姚同学

这是个人本地原型的适配源码归档。仓库保存自行编写的脚本、样式、配置与设计资源，不包含官方客户端、账号状态、真实项目数据或影视原片。项目不是 OpenAI 或腾讯的官方客户端；上游软件、商标与第三方素材的归属见 [NOTICE.md](NOTICE.md)。

新机器的输入基线、构建与验证方式见 [重建说明](docs/REBUILD.md)。官方桌面基线版本固定为 **26.1016.51333 / build 21161**，需要在本地自行提供。当前源代码可通过 `YAOTONGXUE_VENDOR_ROOT` 指定基线目录，默认兼容原来的相邻 `official-desktop/` 布局。

面向腾讯视频长视频宣发素材创作的本地适配版。基于项目内官方 macOS 桌面包 `26.1016.51333`，**保留官方原有页面与主要交互，适配场景内容和 TDesign 视觉样式，并按用户要求增加返回导航、岗位选择与统一的文件演示**。

桌面打开 **姚同学** 替身，它直接指向项目的 `app/姚同学.app`。只保留这一个主应用，桌面不再放第二个启动器应用；腾讯视频只出现在标识、副标题和业务说明中，产品展示名为“姚同学”。主应用通过内置原生入口，在 Electron 启动前设置独立数据目录并传入原有启动参数，应用、日志与账号数据不和原 Codex 共用。

原桌面启动器与 `build/姚同学入口.app` 已归档到 `archive/launchers/`，解包后的文件内容和可执行权限均经验证。桌面现在使用 Finder 替身文件，不会再新增一份可索引的应用。恢复替身时可用 `scripts/create-desktop-alias.swift`；它仅创建文件，不操作 Finder 或应用界面。入口整理记录在 `verification/launcher-deduplication.json`。

## 保留的原版

- 原欢迎页外壳、背景、logo 动画控制器和移动到顶部的路径；标识内部增加一次短促的进场动效。
- 原步骤控制器、步骤次序、可选演示和完成回调；在原页面内增加“上一步”“换角色”与三步返回导航。
- 原岗位卡片网格、顺序、数量、角色枚举、点击与选中行为。
- 原按钮结构、控件尺寸、间距和页面布局；字体、色彩、圆角和边框由薄皮肤覆盖。
- 原客户端的对话、工作区、侧边栏、面板和引擎结构。

`build/content-only-verification.json` 记录原版 `bg`、`Nh`、`pg`、`il`、`al`、`cl` 代码片段的完全一致校验；原页面已有 className 表达式保持不变。未增加页面或步骤。返回导航通过原 footer 的 `progress` 槽与范围内的包装组件实现；原角色卡、任务卡、页面容器和完成回调继续使用。TDesign 皮肤不覆盖原页面尺寸、布局或动效；新增导航的布局规则仅作用于新控件。

## 返回与切换角色

- “上一步”：从工作演示返回任务推荐，从任务推荐返回角色选择。
- “换角色”：直接返回角色选择，保留上次角色、自定义角色输入和已保存的个性化偏好。
- 底部保留原来的三条无文字横杆，可点击返回较早步骤；后续步骤随正常选择解锁。
- 返回前中止正在提交的角色请求，复用原任务取消与 generation 清理，清掉旧任务选择和权限状态。换角色加载新目录期间不展示旧角色任务。
- 所有岗位使用相同的两个可执行演示：宣发需求与剪辑简报、物料版本交付表。沿用官方 `desktop_note` 与 `csv_chart` 的权限、文件写入、预览、保存及取消链路；交付表输出可交互 HTML 与可下载 CSV。

## 仅修改的内容

- 展示名改为“姚同学”；全局共享 logo 叶节点换为腾讯视频官网彩色播放标识，仍使用原外层组件与事件。
- 现有标题、副标题及对话引导说明改为腾讯视频宣发创作语境。
- 原岗位选项适配为研发工程师、产品经理、数据分析、宣发策划、商务合作、内容运营、项目管理、内容审核、算法工程师、视觉设计、视频剪辑和其他岗位。底层角色值、卡片数量与原控制器保持不变，岗位不改变默认推荐的演示任务。
- 原有各岗位的例子统一为宣发文档工作；当前任务推荐直接使用两个原生文件处理任务。撤下纯提示词展示的自定义执行器，演示产物使用完整内置示例需求和物料清单。
- 以 TDesign 的 PingFang SC 字体栈、600 标题字重、腾讯蓝及交互色阶、9px 卡片／6px 主按钮圆角、分层中性色、明暗模式边框为依据；保持原控件尺寸和交互。

早先重做的三步页面已撤下，相关源文件仅归档在 `archive/rejected-redesign/`，不会被打入应用。现行内容位于 `src/content-adaptation.json`、`src/demo-content-literals.json`；导航与原生任务入口适配位于 `src/onboarding-navigation.js`、`scripts/onboarding-extension.mjs`，样式位于 `src/tencent-skin.css`、`src/onboarding-navigation.css`。构建始终从未修改的官方 UI 文件开始。

## 全局标识与开场动效

- 统一替换 18 个共享 SVG 组件、8 个静态 SVG、16px 图标注册项、加载遮罩、两套 Lottie 图形、品牌图片引用和导出字标。原组件尺寸、属性、事件及 Lottie 时间轨迹保留。
- 原生菜单栏、Dock、设置图标预览、通知助手及 Framework 产品标识共 13 个图片资源一并替换，仅作用于项目内的衍生应用。
- 欢迎页标识内部做一次 820ms 进场：轻旋转、放大、模糊渐清，小幅越界后稳定，接回原来移动到顶部的动画。沿用原焦点就绪条件和完成回调；减少动态效果模式下显示静态标识。
- HTML 预加载仅做短淡入与一次低强度扫光，不重复旋转，不循环。动效样式限定在启动标识，不影响侧边栏等位置。

实现位于 `scripts/global-branding.mjs`、`scripts/build-native-branding.mjs`、`scripts/startup-motion.mjs` 和 `src/brand-motion.css`。构建记录为 `build/global-branding-build.json`，残留扫描及结构验证为 `build/global-branding-verification.json`。

## 宣发创作首页

普通首页沿用原有编辑器、项目选择器、建议卡片、上传入口和发送回调。首页作用域内采用 TDesign 的文字层级、腾讯蓝交互色阶、6px 控件／9px 卡片／12px 输入面板圆角、分层边框和浅阴影；侧栏仅在该首页显示时使用对应主题。

“我们要构建什么”原位置改为 18 条简中原文摘抄 tips，每 3 秒以 220ms 的淡入淡出和轻位移切换，围绕人物理解、情绪节奏、真实剧情和好内容传播。原项目选择器留在提示下方，可以继续切换项目。编辑输入期间暂停轮播，隐藏窗口不切换；系统减少动态效果模式下保持静态。

右侧 50% 是代表作品的正式海报拼贴，三列以 240／288／330 秒周期缓慢无缝向上滚动，减少动态效果模式下静止。最右侧不透明度为浅色 0.48／深色 0.36，向页面中间渐隐为完全透明。海报不接收点击，不进入键盘顺序，不覆盖输入区，也不出现在引导页或既有会话。素材来自腾讯官方作品页，优化后随应用打包；精选不代表播放量或热度排名，部分 WeTV 国际发行海报使用英文片名。

组件扩展为 `scripts/home-extension.mjs`、`src/home-tips.js` 和 `src/home-tips.json`；视觉为 `src/home-tdesign.css` 和 `src/home-posters.css`。`assets/home-posters/manifest.json` 保存每张海报的官方页面、图片地址、尺寸和校验值。`build/home-adaptation-build.json` 记录实际构建范围。

首页固定品牌标识为“姚同学 · 视频剪辑 Agent”，副标题强调腾讯视频宣发创作。全局壳层、设置、菜单和输入控件通过 `src/brand-shell.css` 复用 TDesign 的字体、语义色与圆角。

## 可见文案品牌化

`scripts/visible-copy.mjs` 用词法器定位默认消息和简体中文目录中的显示值，统一产品称谓并适配剪辑任务、素材、宣发目标与偏好设置的提示。`scripts/brand-hardcoded-copy.mjs` 精确适配消息目录之外的展示名称，`scripts/native-visible-copy.mjs` 适配系统菜单、启动提示、About 和权限说明。仅修改显示内容，底层消息 ID、模型与接口标识、协议、服务地址及原版权归属继续保留。

`src/tencent-role-profiles.json` 记录岗位映射。默认推荐统一两个实际文件任务，原生调度、权限、执行与完成逻辑保持；旧的按岗位分配纯提示词任务已退役，相关目录和验证归档于 `archive/retired-role-specific-demos/`。

## 运行边界

目前完成内容与视觉适配，原生本地文件生成和交互看板演示可执行。模型及媒体执行链路尚未接入，不能据此声称已经具备新剧自动理解、自动剪辑或反馈驱动重剪能力。登录仍通过官方无认证 provider 配置跳过，凭据来源限定为本应用独立目录，不复制原账号。

## 构建

使用项目现有 Node 运行时执行：

```sh
node scripts/build-ui.mjs
node scripts/build-launcher-icon.mjs
node scripts/package-app.mjs --overlay build/ui-overlay --icon assets/launcher-icon.icns
python3 scripts/sign-app.py
```

新增导航、角色目录、全局标识、开场动效和首页的验证：`node scripts/verify-onboarding-navigation.mjs`、`node scripts/verify-native-demo-tasks.mjs`、`node scripts/verify-global-branding.mjs`、`node scripts/verify-startup-motion.mjs`、`node scripts/verify-home-extension.mjs`。本机签名验证需要可访问 macOS 系统证书的执行环境。

打包保留 ASAR 原生 sidecar，更新 ASAR header 哈希及 Framework 完整性字典摘要，保留全部校验 fuse，再对相关 Helper、Framework、外层应用做本机签名。官方原版 `../official-desktop/app/ChatGPT.app` 与系统 `/Applications/ChatGPT.app` 均未修改。`state/` 为私有运行数据，不应提交或分发。

## 参考

[腾讯视频官网](https://v.qq.com/)的[原始彩色标识](https://vfiles.gtimg.cn/tvideo2/channel-vue/assets/logo-Ckf4UreJ.svg)；[TDesign 字体规范](https://github.com/Tencent/tdesign-common/blob/develop/style/web/theme/_font.less)、[明亮色板](https://github.com/Tencent/tdesign-common/blob/develop/style/web/theme/_light.less)、[暗色色板](https://github.com/Tencent/tdesign-common/blob/develop/style/web/theme/_dark.less)及[圆角规范](https://github.com/Tencent/tdesign-common/blob/develop/style/web/theme/_radius.less)。按用户要求，视觉以 TDesign 为主，MXD 不作为样式依据。当前版本以保留原客户端 UI 为前提，没有套入另一套组件库或重排页面。

动效方向参考 [BUCK 的 Kia AI Assistant](https://www.buck.co/work/kia-ai-assistant) 和 [Ordinary Folk 的 Introducing Spline](https://www.ordinaryfolk.co/project/introducing-spline)，关注细微动作、自然节奏与品牌识别。820ms 时长、旋转角度和缓动是本应用的适配设计，并非复刻案例的实测参数。


首页输入框下方显示六行任务建议：上三行优先选择三个不同的近期文件，每个文件只推荐一项任务。文件不足三个时参考独立近期对话，其余明确提示补充素材，不重复复用同一文件。没有可读文件时明确提示选择素材，不伪造近期文件。下三行为21个专业素材生产任务中的轮换建议，避开上一轮。仅点击填入并聚焦原输入框，不自动提交。文件名使用虚线下划线，通用建议保持短句。轮播原文与出处存于 src/home-tip-sources.json，仅对原繁体引文做繁简转换。
