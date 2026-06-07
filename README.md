# ReserveLink - 社区防灾物资共享与互助调度平台

一个面向社区的防灾物资共享平台，支持物资登记、借用调度、灾害预警联动、信用激励等功能。

## 技术栈

### 后端
- **语言**: Go 1.21+
- **Web框架**: Gin
- **ORM**: GORM
- **数据库**: PostgreSQL 15+
- **缓存**: Redis 7+
- **认证**: JWT
- **密码加密**: bcrypt

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router v6
- **状态管理**: Zustand
- **地图**: Leaflet + React-Leaflet
- **图表**: Recharts
- **HTTP客户端**: Axios
- **PWA**: vite-plugin-pwa

## 核心功能

### 1. 社区与物资登记
- 用户注册/登录，加入社区
- 登记可共享物资（类别、数量、有效期、照片、位置）
- 物资状态流转：可共享 → 已预约 → 借用中 → 已归还/已消耗

### 2. 借用调度流程
- 需求方发布需求（普通/紧急/灾难三级）
- 系统按距离和类别智能匹配物资
- 全流程状态追踪：借用请求 → 物主确认 → 取货码生成 → 线下交接 → 归还验收
- 逾期自动提醒，超时可仲裁

### 3. 灾害预警联动
- 管理员发布预警（台风/地震/洪水等）
- 自动推送应急物资清单
- 标记急需品类，展示覆盖缺口
- 预警生命周期：预警中 → 响应中 → 已解除

### 4. 信用与激励
- 双向评分（出借方评借用方、借用方评物资）
- 信用分影响借用额度
- 社区贡献榜：共享数量、互助次数、平均评分

### 5. 地图与统计
- Leaflet地图标记社区物资分布
- 列表/地图视图切换
- 社区仪表盘：品类饼图、互助趋势、预警响应统计
- 灾后自动生成互助报告

### 6. PWA离线支持
- 缓存静态资源
- 网络不稳定时可查看已加载物资信息

## 项目结构

```
.
├── backend/                    # Go 后端
│   ├── cmd/
│   │   └── server/
│   │       └── main.go        # 主入口
│   ├── internal/
│   │   ├── config/            # 配置管理
│   │   ├── models/            # 数据模型
│   │   ├── handlers/          # HTTP 处理器
│   │   ├── services/          # 业务逻辑
│   │   └── middleware/        # 中间件
│   ├── pkg/
│   │   └── utils/             # 工具函数
│   ├── Dockerfile
│   ├── go.mod
│   └── .env.example
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── components/        # 组件
│   │   ├── pages/             # 页面
│   │   ├── services/          # API 服务
│   │   ├── store/             # 状态管理
│   │   └── types/             # TypeScript 类型
│   ├── public/
│   │   └── manifest.json      # PWA 配置
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml         # Docker 编排
└── README.md
```

## 快速开始

### 方式一：使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd 社区防灾物资共享与互助调度平台

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

服务启动后：
- 前端: http://localhost:3000
- 后端API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 方式二：本地开发

#### 后端

```bash
cd backend

# 复制环境变量配置
cp .env.example .env

# 安装依赖
go mod tidy

# 确保 PostgreSQL 和 Redis 已启动
# 然后修改 .env 中的数据库连接配置

# 启动服务
go run cmd/server/main.go
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## API 接口

### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 社区接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/communities/search` | 搜索社区 |
| GET | `/api/communities/:id` | 获取社区详情 |
| POST | `/api/communities` | 创建社区 |
| POST | `/api/communities/:id/join` | 加入社区 |
| POST | `/api/communities/:id/leave` | 退出社区 |
| GET | `/api/communities/mine/list` | 获取我加入的社区 |

### 物资接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/supplies/search` | 搜索物资（支持距离、类别筛选） |
| GET | `/api/supplies/hot` | 热门物资 |
| GET | `/api/supplies/categories` | 物资分类列表 |
| GET | `/api/supplies/:id` | 物资详情 |
| POST | `/api/supplies` | 发布物资 |
| PUT | `/api/supplies/:id` | 更新物资 |
| DELETE | `/api/supplies/:id` | 删除物资 |

### 借用接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/borrows` | 创建借用请求 |
| GET | `/api/borrows/:id` | 借用详情 |
| PUT | `/api/borrows/:id/approve` | 物主审批 |
| PUT | `/api/borrows/:id/pickup` | 确认取货 |
| PUT | `/api/borrows/:id/return` | 归还验收 |
| PUT | `/api/borrows/:id/rate` | 双向评分 |
| GET | `/api/borrows/mine/borrows` | 我的借用 |
| GET | `/api/borrows/mine/lends` | 我的出借 |

### 预警接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/alerts` | 预警列表 |
| GET | `/api/alerts/:id` | 预警详情 |
| POST | `/api/alerts` | 发布预警（管理员） |
| GET | `/api/alerts/:id/supplies` | 预警物资清单 |
| GET | `/api/alerts/:id/match-gap` | 匹配物资缺口 |

### 统计接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats/dashboard` | 仪表盘数据 |
| GET | `/api/stats/contribution-rank` | 社区贡献榜 |
| GET | `/api/stats/mutual-aid-report` | 互助报告 |

## 数据模型

### User（用户）
- ID, Username, Email, PasswordHash, Phone, Avatar, CreditScore, IsAdmin

### Community（社区）
- ID, Name, Description, Location, Lat, Lng, AdminID

### Supply（物资）
- ID, OwnerID, CommunityID, Category, Name, Description, Quantity, Unit, ExpireDate, PhotoURL, Lat, Lng, Status

### BorrowRequest（借用申请）
- ID, RequesterID, SupplyID, Quantity, Purpose, Priority, Status, PickupCode

### Alert（预警）
- ID, Title, Type, Level, Description, AffectedArea, Status, CreatorID

## 物资状态流转

```
available (可共享)
    ↓
reserved (已预约)
    ↓
borrowed (借用中)
    ↓
returned (已归还) / consumed (已消耗)
```

## 预警状态

```
warning (预警中)
    ↓
responding (响应中)
    ↓
resolved (已解除)
```

## 开发说明

### 环境变量

后端 `.env` 配置：
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=reservelink
DB_PASSWORD=reservelink123
DB_NAME=reservelink
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
SERVER_PORT=8080
```

### 数据库迁移

后端启动时会自动执行 GORM AutoMigrate，创建所有数据表。

## License

MIT
