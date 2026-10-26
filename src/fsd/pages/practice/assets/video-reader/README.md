# 纯视频静态控制栏素材

职责：仅供`pages/practice/ui/PureVideoReader.tsx`还原纯视频原稿控制栏，不包含媒体或播放能力。

来源为ManiShare Figma `z7SIwUb9ep0j0ZaEwFrxJl`／`546:43497`，通过`download_figma_images`逐节点导出，原样保留根尺寸、viewBox及路径：

- `pause.svg`：`546:43512`，24×24。
- `volume.svg`：`546:43515`，24×24。
- `picture-in-picture.svg`：`546:43526`，24×24。
- `fullscreen.svg`：`546:43520`，24×24。

封面与背景按用户“先随便放一张封面”的授权直接复用同一页面owner下`video-listening/poster.png`，不复制或重新导出。整页设计参考只保存于ignored `dist/design-reference/pure-video-546-43497.png`供检查，不参与页面实现或部署。

图标通过静态import转为`.src`，按固有24×24呈现，不随封面宽度拉伸；仅放在原生disabled按钮中，不假装可操作。未来接入媒体时再增加相应行为、状态和验收，不在本阶段引入视频源、依赖或外部请求。已核对文件和根尺寸，实际PC及平板／H5视觉待用户验收，未运行构建或应用验收。
