# Features

- 职责：承载用户可感知的英语学习业务动作，例如收藏课程、提交练习和保存笔记。
- 入口：每个 feature 在自身目录根部通过 `index.ts` 公开；当前包含 `edit-course-collection`、`play-celebration` 、`submit-feedback` 和 `pk-create-room`。
- 约束：通用领域类型放入 `entities`，无业务含义的能力放入 `shared`；同层 feature 不得深层互相导入。
- 扩展：首次新增 feature 时创建 `features/<feature-name>/README.md`、`index.ts` 与所需 `ui`/`model`，并登记可验证行为。
- 验证：按改动范围运行同目录测试、`pnpm run lint` 与 `pnpm run build`。

daily-checkin拥有可独立描述的本地每日签到动作、记录校验与不可关闭打卡窗；首页负责其进入顺序，根index暴露能力，不反向依赖pages。
