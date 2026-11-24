# 源码归档核验

2026年11月24日，在原本地的匹配桌面基线下执行了下列检查：

- `scripts/check-source.mjs`检查适配源码的JavaScript语法与JSON格式。
- `scripts/verify-recommendation-engine.mjs`的15项合成数据检查通过，覆盖素材去重、选中目录范围、缺失输入和任务轮换。
- `scripts/verify-onboarding-navigation.mjs`的13项检查通过，覆盖返回导航、角色切换和取消后防止过期更新。
- `scripts/verify-native-demo-tasks.mjs --source`的8项检查通过，覆盖原生文件演示的权限、取消与完成链路。
- `scripts/verify-recommendation-runtime.mjs`的10项检查通过，覆盖元数据读取边界、超时取消和六行推荐交互。
- `scripts/verify-startup-motion.mjs`的8种焦点/减少动态效果情况通过。
- `launcher.c`、`native-entry.c`通过macOS Clang的`-Wall -Wextra -Werror -fsyntax-only`检查。
- 新的基线/工具路径配置在原默认目录下可加载sharp与ASAR工具，基线目录可通过环境变量指定。

上传前通过暂存区文件检查核对秘密特征、大文件、机器用户名路径和排除目录。扫描器只输出文件路径与问题类别，不输出疑似秘密值，可使用`node scripts/audit-source.mjs`复查。

本次没有重新打包完整应用、启动图形界面或进行真实媒体任务验收。模型与媒体执行链路仍待接入。原始官方包、运行状态及本机历史验证输出不随Git归档。
