# 本地重建说明

该仓库保存个人适配层，可执行界面依赖本地提供的官方桌面基线。源码归档不包含登录状态、公司项目数据、影视原片、官方应用或完整官方前端。

## 基线与目录

需要macOS Apple Silicon、Node.js 22或更新版本、Python 3及Apple Command Line Tools。原始桌面基线固定为26.1016.51333、build 21161；脚本包含针对该版本编译文件的检查点，不能直接假定兼容其他版本。

本地基线目录应包含：

```text
official-desktop/
  app/ChatGPT.app/
    Contents/Resources/app.asar
    Contents/Resources/app.asar.unpacked/
  extracted-app/
    webview/
    .vite/build/
```

`extracted-app/`必须从同一份原始ASAR解包，不能混用版本。仓库默认在相邻的`../official-desktop/`查找；其他位置可设置：

```sh
export YAOTONGXUE_VENDOR_ROOT="/absolute/path/to/official-desktop"
npm install
npx asar extract "$YAOTONGXUE_VENDOR_ROOT/app/ChatGPT.app/Contents/Resources/app.asar" "$YAOTONGXUE_VENDOR_ROOT/extracted-app"
```

ASAR外置原生模块必须保留在原始应用目录。官方版本历史下载是否仍可用需自行确认；从已有合法备份恢复时保留基线与来源校验记录。完整官方应用不能通过仅下载`openai/codex`开源仓库替代。

打包脚本优先使用相邻`../tooling/asar/`中的既有ASAR工具，也可用`YAOTONGXUE_TOOLING_ROOT`指定该工具目录；没有既有工具时使用`npm install`安装的依赖。图像脚本优先使用官方基线内的sharp，缺少时使用本仓库的sharp依赖。

## 素材与项目范围

仓库保留原型图标与装饰素材，以及第三方来源说明。影视海报和官方参考照片不提交Git；需要展示时，将有权使用的图片按`assets/home-posters/manifest.json`的`localFile`名称放到该目录。`npm run hydrate:posters`是原型使用的官方公开页面素材获取脚本，是否可使用及是否仍可下载应由使用者确认。

首页默认演示项目目录为源码仓库自身。需要使用其他本地项目时，在构建前设置`YAOTONGXUE_PROJECT_ROOT`。不要把用户文件、聊天记录、账号配置或运行数据库提交到本仓库。

## 验证与构建

不需要官方基线的检查：

```sh
npm run check
npm test
```

具有匹配的官方解包基线后，可运行额外的交互结构和推荐运行时校验：

```sh
npm run test:baseline
```

准备好本地素材后生成适配层，再打包项目内的副本：

```sh
npm run build:overlay
npm run package:mac
python3 scripts/sign-app.py
```

构建输出在`build/`和`app/姚同学.app/`，运行状态在`state/`，均已被Git忽略。打包与签名是独立步骤，不会自动启动应用。既有签名身份和本机桌面替身不会随仓库传递。

主应用使用`native-entry.c`在Electron启动前根据应用所在位置设置独立运行目录。`launcher.c`保留为可选外部启动器，可传项目目录参数或设置`YAOTONGXUE_ROOT`，不再依赖原电脑用户名。

## 已有功能与边界

已有内容与视觉适配、角色与任务推荐、首页提示和素材海报展示、原生本地文件生成演示。模型、媒体执行链路以及从新剧理解到自动剪辑的业务接入尚未完成。

源代码检查和既有合成数据测试不等于完整应用视觉验收、真实媒体任务验收或重建后签名可用性验证。相应核验范围见README和本地生成的验证记录；旧机器的验证记录不作为新机器当前验收结果。
