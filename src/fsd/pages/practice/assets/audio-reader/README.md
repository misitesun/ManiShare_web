# 纯音频静态控制栏素材

职责：仅供页内`PureAudioReader`还原居中的播放／暂停入口；当前只控制声纹预览，不包含真实音频或进度逻辑。

来源为ManiShare Figma `z7SIwUb9ep0j0ZaEwFrxJl`／`546:43531`，通过`download_figma_images`逐节点导出，原样保留32×32根尺寸、viewBox与路径：

- `play.svg`：`546:43555`。

用户已确认移除随机、上一条、下一条和重复功能，对应四份SVG在移除最后引用后删除。`pause.png`来自用户提供的`/Users/sly/Downloads/Frame.png`，原样复制并保留32×32尺寸与透明通道，替换此前借用的听力暂停图标；源文件与本地副本SHA-256一致，不重绘或压缩。

图标通过静态import转为`.src`，按固有尺寸呈现，不随声纹区域拉伸；手机按钮触控区域40px、md以上32px，按钮浮层阻断时disabled并取消pointer光标。深浅主题沿既有shell-icon滤镜。

原稿`546:43542`的496×280静态声纹图，按用户要求由`features/learning-settings`根入口的`LearningAudioWave`替换，原70px动画在该槽位内居中；不使用设计截图冒充动画，不保留已无引用的旧`audio-cover.png`。五种动画与主题、可见性、reduced-motion和清理由原组件拥有，不在素材目录复制动画实现。

设计整页仅保存于ignored `dist/design-reference/pure-audio-546-43531.png`供核对，不参与实现或部署。已核对下载文件和根尺寸，实际PC及平板／H5视觉待用户验收，未运行构建或应用验收。
