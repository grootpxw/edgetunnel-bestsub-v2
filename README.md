# EdgeTunnel BestSub v2 🚀

这是 EdgeTunnel BestSub 的全新版本，采用现代化的深色主题界面，支持中英文切换。

## 🎨 新特性

### 界面升级
- ✨ 全新深色主题设计
- 🎯 侧边栏导航布局
- 🌐 中英文双语支持
- 📱 完全响应式设计
- 🎭 现代化的渐变色和发光效果

### 功能保持
- ✅ 所有原有功能完整保留
- ✅ API 接口完全兼容
- ✅ 配置文件格式不变
- ✅ 后端逻辑完全一致

---

## 📖 关于原项目

EdgeTunnel BestSub 是一个用 Go 编写的 Cloudflare CDN 连通性测试与配置辅助工具。它会从多个 IP/CIDR 来源采集候选地址，按你的 Worker 域名进行 TCP、TLS、HTTP 探测，筛出可用且延迟更低的入口 IP，并生成兼容 EdgeTunnel Worker 的 `ADD.txt`。

项目定位是本地运行的网络连通性测试与配置管理工具：配置简单、结果可视化、支持国家/地区筛选，适合配合已经部署好的 Worker 做个人测试和配置维护。

---

## 🚀 快速开始

### 1. 编译项目

```bash
cd D:\Groot\WorkProject\edgetunnel-bestsub-v2
go build -o bestsub-v2.exe ./cmd/bestsub
```

### 2. 配置文件

配置文件位于 `configs/config.yaml`，已自动从原项目复制。

**重要变更：**
- ⚠️ 默认监听端口改为 `8081`（避免与原版本冲突）
- 其他配置保持不变

### 3. 运行程序

```bash
# Windows
bestsub-v2.exe -serve

# 或者直接双击 bestsub-v2.exe
```

### 4. 访问界面

打开浏览器访问：**http://127.0.0.1:8081**

## 🌍 语言切换

点击右上角的语言切换按钮（**EN** / **中文**）即可切换界面语言。语言设置会自动保存到浏览器本地存储。

---

## 🔧 与原版本的区别

| 项目 | 原版本 | v2 版本 |
|------|--------|---------|
| 监听端口 | 8788 | **8081** |
| 界面风格 | 简洁白色 | **深色主题** |
| 布局方式 | 单列布局 | **侧边栏导航** |
| 语言支持 | 仅中文 | **中英文切换** |
| 模块名称 | edgetunnel-bestsub | **edgetunnel-bestsub-v2** |

## 🎯 使用建议

### 方案 A：两个版本并存（推荐）
- 原版本继续运行在 `8788` 端口
- v2 版本运行在 `8081` 端口
- 可以同时使用，互不干扰

### 方案 B：完全替换
如果 v2 版本测试稳定，可以：
1. 停止原版本程序
2. 将 v2 版本的端口改回 `8788`
3. 完全替换原版本

---

## 📂 项目结构

```
edgetunnel-bestsub-v2/
├── cmd/
│   └── bestsub/
│       └── main.go           # 主程序入口
├── internal/
│   ├── app/                  # 核心业务逻辑
│   ├── clash/                # Clash 配置生成
│   ├── config/               # 配置管理
│   ├── preflight/            # 环境预检
│   ├── probe/                # IP 探测
│   ├── proxyip/              # 反代 IP 优选
│   ├── source/               # IP 源管理
│   ├── web/                  # Web 服务器
│   │   └── static/
│   │       ├── index.html    # 新版前端页面
│   │       ├── style-v2.css  # 新版样式
│   │       ├── app.js        # 业务逻辑（已适配）
│   │       ├── i18n.js       # 国际化支持
│   │       └── lucide.min.js # 图标库
│   └── worker/               # Worker 客户端
├── configs/
│   ├── config.yaml           # 配置文件（端口 8081）
│   └── config.example.yaml   # 配置示例
├── go.mod
└── README.md
```

---

## 🐛 问题排查

### 端口冲突
如果提示端口被占用：
```bash
# 检查端口占用
netstat -ano | findstr :8081

# 修改配置文件中的端口
# configs/config.yaml -> server.listen
```

### 编译错误
```bash
# 清理并重新下载依赖
go clean -modcache
go mod tidy
go build -o bestsub-v2.exe ./cmd/bestsub
```

### 界面显示异常
- 清除浏览器缓存
- 强制刷新页面（Ctrl + F5）
- 检查浏览器控制台是否有错误

---

## 📝 原版本功能说明

### 功能特性

- 本地 Web UI：浏览器打开即可配置、预检、测速和查看结果
- 快速 / 稳定模式：快速模式适合日常刷新，稳定模式会多轮复测并优先保留持续可用、波动更小的入口
- 多来源采集：支持远程 CIDR/IP 列表和本地 `seeds.txt` 种子文件
- 目标站点测速：可针对指定 Worker 域名、Host、SNI 和 URL 做真实请求探测
- 国家/地区筛选：前端可多选地区，只保留匹配 Cloudflare 访问节点的结果
- 环境预检：检测 Windows 系统代理和异常低延迟，避免开代理时得到无意义结果
- 配置生成：输出 EdgeTunnel Worker 可直接读取的 `ADD.txt`
- 本地 Clash 配置：可基于测速结果生成四分组 Clash YAML，并写入 Clash Verge profiles 目录
- 可选推送：保留登录 Worker 并推送 `ADD.txt` 的接口能力，建议确认配置后再启用

### 运行要求

- Go 1.22 或更高版本
- Windows、Linux、macOS 均可运行
- 一个已经部署好的 EdgeTunnel Worker 域名

### 命令行测速

只运行一次测速：

```bash
bestsub-v2.exe -run -config configs/config.yaml
```

输出 JSON：

```bash
bestsub-v2.exe -run -json -config configs/config.yaml
```

测速后尝试推送到 Worker：

```bash
bestsub-v2.exe -run -push -config configs/config.yaml
```

如果 `output.dry_run` 为 `true`，即使带了 `-push` 也不会真正推送。

---

核心配置位于 `configs/config.yaml`：

```yaml
server:
    listen: "127.0.0.1:8788"

worker:
    base_url: "https://your-worker.workers.dev"
    password: "your_password"
    user_agent: "bestsub-go/0.1"

probe:
    target:
        mode: "worker"
        url: "https://your-worker.workers.dev/robots.txt"
        host: "your-worker.workers.dev"
        sni: "your-worker.workers.dev"
        method: "HEAD"
        expected_status: [200, 204, 301, 302, 403, 404]
    countries: []
```

常用参数：

- `candidate_limit`：单次加载的最大候选数量，越大越慢。
- `keep`：最终保留的最优 IP 数量。
- `timeout_ms`：单个 IP 的探测超时时间。
- `concurrency`：并发探测数量，过高可能造成网络抖动。
- `countries`：国家/地区过滤，例如 `[HK, JP, SG]`。
- `require_geoip_match`：是否强制要求 IP 注册归属地和 Cloudflare 访问节点国家一致，默认 `false`。
- `geoip_db_path`：GeoIP 数据库路径；只有 `require_geoip_match: true` 时才会使用。
- `output.path`：生成的订阅文件路径，默认 `ADD.txt`。
- `output.dry_run`：是否禁用真实推送。
- `clash.local_profile_dir`：Clash Verge profiles 目录；留空时前端不会允许生成本地 Clash 配置。
- `clash.auto_register`：生成后调用 Clash Verge 官方 URL Scheme 导入配置；不会自动切换当前配置。
- `clash.uuid` / `clash.host`：生成 VLESS WebSocket 节点需要的基础参数。
- `clash.test_url`：Clash fallback 分组健康检查地址，推荐 `http://www.gstatic.com/generate_204`。
- `clash.rules_file`：外部 Clash 规则文件；默认只直连本机/局域网/保留地址，其它全部进入 `♻️ 自动选择`。
- `clash.proxyip`：手动写死到本地 Clash path 的反代；使用 Worker 动态 `PROXYIP.txt` 时应留空。

## IP 来源

默认示例配置包含：

- `cmliu-cf-cidr`：Cloudflare CIDR 地址段来源。
- `xiu2-ipv4`：常见优选 IPv4 列表来源。
- `cf-ipv6`：Cloudflare 官方 IPv6 地址段。
- `local-seeds`：本地 `seeds.txt`，可手动追加你自己的 IP。

远程来源会在测速时下载；如果网络环境访问 GitHub 不稳定，可以把常用 IP 放入 `seeds.txt`。

## GeoIP 数据库

默认配置不需要 `GeoLite2-Country.mmdb`。项目不会自动下载该文件，也不建议把 `.mmdb` 数据库提交到 GitHub。

`countries` 筛选使用的是 Cloudflare 返回的 `CF-Ray` 访问机房信息，例如 HKG、NRT、SIN，并不等同于 IP Whois 或 GeoIP 注册地。Cloudflare Anycast IP 经常出现“注册地是美国，但实际访问机房在日本/新加坡/香港”的情况，所以默认保持：

```yaml
require_geoip_match: false
geoip_db_path: ""
```

只有在你明确想过滤掉“IP 注册归属地和访问机房国家不一致”的结果时，才需要开启：

```yaml
require_geoip_match: true
geoip_db_path: "GeoLite2-Country.mmdb"
```

开启后需要自行从 MaxMind 下载 GeoLite2 Country 数据库，并把 `GeoLite2-Country.mmdb` 放到程序运行目录，或把 `geoip_db_path` 改成实际文件路径。如果文件不存在，程序不会自动下载。

快捷下载（社区镜像，无需注册）：

```powershell
# Windows PowerShell
Invoke-WebRequest -Uri "https://git.io/GeoLite2-Country.mmdb" -OutFile "GeoLite2-Country.mmdb"
```

```bash
# Linux / macOS
curl -L -o GeoLite2-Country.mmdb https://git.io/GeoLite2-Country.mmdb
```

## ADD.txt 格式

程序会生成兼容 EdgeTunnel Worker 的文本格式，IPv6 会自动使用方括号：

```text
172.64.229.104:443#IP 官方优选 64ms SIN/SG
[2606:4700:e1::ac40:e568]:443#IP 官方优选 42ms HKG/HK
```

生成文件默认写入 `ADD.txt`，该文件是运行产物，默认不会提交。

## 注意事项

- 测速前建议关闭系统代理，否则测速结果可能只是本机代理出口。
- 国家/地区筛选基于 Cloudflare 访问节点信息，不等同于 Whois 查询到的 IP 注册地。
- `GeoLite2-Country.mmdb` 是可选高级功能依赖，默认不需要；发布项目时不要提交该数据库文件。
- Cloudflare Anycast IP 状态会变化，优选结果适合定期刷新，不建议长期固定。
- 推送能力依赖你的 Worker 登录逻辑和 `/admin/ADD.txt` 接口，请先用 `dry_run` 或手动检查结果确认。

## 免责声明

本项目仅用于学习、研究及个人网络连通性测试。使用者应自行了解并遵守所在国家或地区的法律法规及相关平台服务条款。

本项目不提供任何可用性、稳定性或合规性保证。因使用、修改、分发本项目或其生成配置而产生的任何风险与后果，由使用者自行承担。

请勿将本项目用于未授权访问、违法用途或违反第三方服务条款的行为。

## 项目状态

当前版本适合个人本地使用和继续迭代。Web UI、配置持久化、环境预检、快速/稳定测速、结果生成已经具备基础可用性。

---

## 🙏 致谢

- 原项目：[EdgeTunnel BestSub](https://github.com/grootpxw/edgetunnel-bestsub)
- UI 设计灵感：Stitch AI
- 图标库：[Lucide Icons](https://lucide.dev/)
- 字体：[Outfit](https://fonts.google.com/specimen/Outfit), [JetBrains Mono](https://www.jetbrains.com/lp/mono/)

---

## 📄 许可证

与原项目保持一致
