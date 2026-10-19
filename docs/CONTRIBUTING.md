# 小组协作说明

## 每个人改哪里

| 负责内容 | 文件夹 | 建议分支名 |
| --- | --- | --- |
| 知识图谱、课程内容 | `knowledge-map/` | `feature/knowledge-map` |
| 基础诊断、个性化路径 | `learning-path/` | `feature/learning-path` |
| 模拟面试、过程回放 | `interview/` | `feature/interview` |
| AI 答案纠错 | `correction-lab/` | `feature/correction-lab` |

每个模块的 `index.html` 是页面，`style.css` 放模块自己的样式，`script.js` 放模块逻辑。知识图谱的课程内容另外放在 `data.js`。

## 最简单的修改流程

在 GitHub Desktop 中：先拉取 main，建立自己的分支，修改文件，提交并推送，然后创建 Pull Request，请另一位同学检查后合并。也可以使用 GitHub 网页编辑少量文件。

使用命令行时，例如：

```sh
git switch main
git pull --ff-only
git switch -c feature/knowledge-map
# 修改文件，在浏览器检查
git add knowledge-map/
git commit -m "Update knowledge map lessons"
git push -u origin feature/knowledge-map
```

之后在 GitHub 创建 Pull Request。已经有这个分支时直接切换过去，不需要重复建立。

## 修改前约定好

- 尽量在自己的模块里改；修改 `shared/` 前告诉其他人。
- 新 CSS 放在本模块的 `style.css`，使用模块专用 class，避免影响其他模块。
- 不要随意更改公共知识点编号，它们用于跨模块跳转。
- 不要把整个本地项目重新上传覆盖仓库，只提交本次修改。
- 不要把 `.env`、API 密钥或个人练习记录提交到仓库。
- 每个成员保留自己的开发提交和测试记录。

## 本地预览和检查

在仓库根目录运行 `python -m http.server 8000`，浏览器打开 `http://localhost:8000`。没有 Python 时，可以使用编辑器的本地静态服务器。

运行 `python scripts/check_site.py` 检查文件和链接。修改交互后，实际点一遍，并刷新页面检查数据是否保留。最后检查手机宽度下有没有横向溢出。

当前是静态原型：不要把预设回答或规则推荐写成已经接入真实 AI。后续接 AI、账号和数据库时，先讨论服务端接口和共享数据格式。
