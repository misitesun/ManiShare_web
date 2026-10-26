# 纯图片轮播素材

- `previous.svg`：Figma `z7SIwUb9ep0j0ZaEwFrxJl`／`1778:10951`。
- `next.svg`：同文件`1778:10955`。
- 两图按`546:43565`原节点导出，保留50×50根尺寸、路径、半透明圆底和白色箭头；仅由页内`PurePictureReader`消费。
- 首图复用上级`picture-reader.png`（`546:43589`）；其余四张演示图片按`model/picture-reader-demo.ts`直接引用已有owner素材，不复制文件、不声称已取得正式课程图片。
- 原稿图片上的渐变、圆角与指示器由主题token及DOM绘制，整页设计截图不参与运行。
- 本轮仅源码／格式／差异检查，PC与平板／H5的视觉和真机操作仍待用户验收。
