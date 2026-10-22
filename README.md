# DataVerse Homepage

上海数元衍宇智能科技有限公司的中英文官网首页。品牌名：**DataVerse**。

## 本地预览

```sh
npm run dev
```

访问 http://127.0.0.1:4173 。网站为纯静态 HTML/CSS/JavaScript，不需要安装依赖或构建。

```sh
npm run check
```

## 内容与样式

- `dist/index.html`：页面结构、中文内容，以及首页 9 个产线的数据产品展厅。
- `dist/content.js`：中文和英文文案。语言选择保存在访问者的本地浏览器中。
- `dist/styles.css`：响应式样式及减少动态效果的偏好支持。
- `dist/app.js`：语言切换、导航状态和轻量 SVG 数据图。
- `dist/assets/wentao.jpg`：张文涛个人主页所公开的本人照片。

原首页首屏和公司章节位于 `index.html`；公开数据样本库的中英文文案位于 `content.js` / `datasets-copy.js`。数据产品展厅的中文文案位于 `products-data.js`。

## 数据产品展厅

首页业务介绍之后展示 Coding/SWE、法律、工业、Autoresearch、Office 办公、游戏、Lean 数学、RSI-SWE 与图文 / ChartVQA。每个产线以精选样例展示用途、数据格式和交付内容；More 入口直达联系区域。

- `dist/products-data.js`：9 个产线的介绍与交付信息。
- `dist/products.js` / `products.css`：可用方向键切换的产线展厅、原始图片放大与办公成品页面切换。
- `dist/product-chartvqa.js` / `product-chartvqa.css` / `product-chartvqa-data.js`：新增图文产线，内嵌单个森林调查真实样例，支持证据定位、读图/对齐/计算/答案切换与原始字段展开。计算使用图中标注值，展示步骤不冒充原始轨迹。
- `dist/product-excerpts.js`：Lean 定理节选、RSI 参考运行奖励与 STEP 几何摘要。
- `dist/product-examples.js`：法律任务/证据/输出接口、Autoresearch 五阶段真实运行节选、RSI 改进记录/代码/评测反馈。
- `dist/product-records.js` / `product-records.css`：样例内容切换、自动研究流程回放、工业三维分区动画。
- `dist/assets/products/`：用户提供交付包中的原始 GLB、办公成品 JPG 和科研方法图。仅选择展示素材，不迁入完整题库、运行日志或办公原文件。
- `dist/products-provenance.json`：素材在交付包中的相对路径、选取规则与 SHA-256。图像和 GLB 按字节原样复制；工业三维预览由原始 STEP 曲面离线三角化生成；原件是一个整体工件，展开动画将其按几何区域分组，不代表独立制造零件或 FEM 结果。
- 游戏 GLB 和结构化 Orb Rush 轨迹为同一交付包中的不同样例；页面不会把两者包装成同一次运行。RSI 保留原始参考运行反馈，accepted 指可参与评分，不表示通过所有测试。法律展示的输出接口是交付规范，不伪造模型答案；Autoresearch 回放已有记录，不执行在线推理。

三维查看器随展厅进入视口按需加载，支持拖动及方向键旋转；离开产线时释放 WebGL 资源，离开视口或页面隐藏时停止渲染。不支持 WebGL 时显示说明，其余产线仍可浏览。页面无外部 CDN 请求。

`dist/showcase-viewer.js` 是已提交的静态 bundle，普通预览无需安装依赖。修改三维查看器后，使用锁定版本重新打包：

```sh
npm ci
npm run build:showcase
npm run check
```

源码为 `scripts/showcase-viewer-source.js`；Three.js MIT 许可随静态素材保留。沿用纯静态部署方式。

构建时同步为首页脚本和样式添加内容哈希版本，避免新 HTML 混用旧缓存。仅修改文案或交互后，可运行 `node scripts/stamp-showcase-assets.mjs` 更新资源版本。

更新原始样例时运行 `scripts/prepare-product-examples.py --data-root <各产线数据Demo路径>`；工业网格使用 `node scripts/prepare-industrial-model.mjs <export_17.step路径>` 生成。转换器 occt-import-js 仅在本地准备素材时使用，不进入浏览器包。脚本会同步更新抽取记录与几何素材的来源哈希。

## 内容依据与待补资料

- 设计参考：https://unipat.ai/ 。独立实现代码、品牌和文案。
- 张文涛的简介与照片来源：https://zwt233.github.io/ 。仅使用简短可验证履历，不添加公司职位。
- 王雪目前仅展示姓名，无职位、履历或虚构照片。WX 图案是姓名字母图形。
- 公司正式名称与品牌名由用户提供。英文法定名称未确认，英文页面页脚继续使用中文法定名称。
- 公司邮箱尚未提供，联系按钮指向张文涛个人主页。收到邮箱后将其替换为公司联系邮箱。
- 业务方向为首版定位文案，待公司确认具体产品及服务后可进一步更新；未添加客户、业绩数字或产品成果。

## 发布

`dist/` 可直接用于 GitHub Pages、Cloudflare Pages 或任意静态托管。若使用 GitHub Pages，请在仓库设置中选择 GitHub Actions，然后启用附带的手动部署工作流。

Sites 私有预览的部署配置存放在 `.openai/hosting.json`。GitHub Actions 工作流不会自动运行；在正式资料确认后可手动发布到 GitHub Pages。

## 数据样本迁移

公开数据样本位于独立的 `datasets.html` 页面。首页导航的“样本库”与展厅下方链接打开该页；“数据产品”导航及首屏 CTA 进入首页的 9 产线交付展厅。独立页原有单轮图像拖动对比、多轮编辑逐步浏览、文本/SQL/代码阅读、Coding Agent 工具轨迹展开及单条 JSON 下载功能保留。

迁移来源为 [OpenDCAI_Data](https://github.com/haolpku/OpenDCAI_Data)，固定版本 `7cd08ea8c830d304b63130c5303c39ae80cc251e`。这是**展示样本迁移**，不是全量训练语料迁移。当前文件实际包含的展示样本数与原 README 的每类 100+ 条描述不同，本站仅显示实际迁入数量。

| 类别 | 迁入样本 | 选择依据 |
| --- | ---: | --- |
| 单轮图像编辑 | 3 | 迁入全部公开图像对、原始编辑指令及不变约束 |
| 多轮图像编辑 | 3 | 完整轮次、规则变更、跨版本组合和历史引用 |
| 文本 SFT | 1 | 回答完整，保留 SuperFiltering 和 Deita 原始分数；其他展示回答有截断 |
| Text2SQL | 3 | SQL 在构造的 SQLite 测试表上核验结果，保留原始问题和推理 |
| 代码生成 | 1 | 原始循环移位解答通过题面示例及 5 个非空输入测试；并非完整测试覆盖 |
| Coding Agent | 2 | stats.py 修复和 slow_dedup.py 重构，含工具/观察记录；排除 mock 知识检索轨迹 |

没有迁入缺少 `List` 导入的代码样本及发现题面不一致的数学样本。没有修改样本回答来提高评分。自动评分仅以源记录分数展示，不作为 DataVerse 独立评测，不跨量表比较，也不对整体数据质量做数量化承诺。

- `dist/datasets-data.js`：精选记录、双语类别和标题；原始内容不翻译或改写，仅重定位本地图像路径。
- `dist/datasets-provenance.json`：来源版本、类别索引和 27 张展示图像的 SHA-256。
- `dist/assets/datasets/`：源仓库展示缩略图，按字节原样复制。原始记录中的高分辨率参数不等于当前缩略图分辨率。
- 原始仓库没有提供 LICENSE 文件；此迁移保留来源，并不赋予新增商业授权或再分发许可，公开商用发布前需确认各原始数据来源的具体许可。
