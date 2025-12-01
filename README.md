# PDF Reader based on WebAssembly

这是一个基于WebAssembly技术的纯前端PDF阅读器，可以直接部署到GitHub Pages上使用。

## 项目特点

- 纯前端实现，无需后端服务器
- 基于WebAssembly的高性能PDF渲染
- 支持文本选择、搜索、书签等功能
- 响应式设计，支持多种设备

## 部署到GitHub Pages的步骤

### 1. 准备部署文件

运行部署脚本以整理和准备部署文件。

使用Python脚本（推荐，无依赖）：
```bash
python deploy.py
```

或者使用Node.js脚本：
```bash
node deploy.js
```

该脚本会创建一个`docs`目录，其中包含所有必要的文件，并调整路径引用以适应GitHub Pages的部署环境。

### 2. 提交更改到GitHub

```bash
git add .
git commit -m "Prepare for GitHub Pages deployment"
git push origin main
```

### 3. 在GitHub上启用GitHub Pages

1. 打开你的GitHub仓库页面
2. 点击"Settings"选项卡
3. 向下滚动到"Pages"部分
4. 在"Source"下拉菜单中选择：
   - 选择"Deploy from a branch"
   - 选择分支（通常是main或master）
   - 选择/docs文件夹
5. 点击"Save"

### 4. 访问你的网站

配置完成后，GitHub会提供一个URL（通常是`https://<username>.github.io/<repository>`），你可以在几分钟后访问你的PDF阅读器。

## 使用说明

1. 打开部署后的网站
2. 将PDF文件拖拽到页面上即可查看
3. 使用顶部工具栏进行缩放、旋转等操作
4. 左侧边栏可以查看书签和缩略图

## 自定义配置

### 使用自定义域名

如果想使用自定义域名：

1. 在`docs`目录中创建一个名为`CNAME`的文件
2. 在文件中添加你的域名，例如：
   ```
   mypdfreader.example.com
   ```
3. 按照上述步骤提交并推送到GitHub
4. 在你的DNS提供商处配置CNAME记录指向`<username>.github.io`

### 修改主题

可以通过修改以下文件来自定义外观：
- `docs/index.html` - 主页面结构
- CSS样式在HTML文件的`<style>`标签中

## 技术架构

项目采用分层架构设计：

1. **UI层** (`docs/index.html`和相关CSS) - 提供用户界面
2. **API层** (`docs/js/api.js`) - 提供统一的JavaScript API
3. **控制层** (`docs/js/viewer.js`) - 处理用户交互和页面管理
4. **数据层** (`docs/js/file.js`) - 管理PDF文档数据和与WASM模块的交互
5. **渲染引擎** (`docs/engine/drawingfile.js`和`docs/engine/drawingfile.wasm`) - 基于WebAssembly的高性能PDF渲染引擎

## 浏览器兼容性

需要支持以下特性的现代浏览器：
- WebAssembly支持
- HTML5 Canvas
- File API
- Fetch API

主流浏览器的最新版本通常都支持这些特性。

## 文件说明

- `docs/engine/drawingfile.wasm` - 核心的WebAssembly模块，负责PDF/OFD解析和渲染
- `docs/engine/drawingfile.js` - WebAssembly模块的JavaScript包装器
- `docs/js/viewer.js` - PDF查看器的主要逻辑
- `docs/js/file.js` - PDF文件处理逻辑
- `docs/js/api.js` - 对外提供的API接口

## 注意事项

1. WASM文件较大（约38MB），加载可能需要一些时间
2. 第一次使用时会加载字体文件，可能需要一些时间
3. 由于是纯前端应用，所有处理都在浏览器中进行，大文件可能影响性能
