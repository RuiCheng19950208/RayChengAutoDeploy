# Unity 分数同步 - 简化版集成指南

## 概述

这是一个极简的Unity与Web前端的分数同步方案。Unity只负责上传分数，前端负责用户身份认证和后端通信。

## 工作原理

1. **Unity游戏结束** → 调用JavaScript全局函数 `window.handleUnityScore(score)`
2. **前端接收分数** → 使用当前用户的token提交到后端API
3. **后端验证并更新** → 检查是否为新记录并更新数据库
4. **前端显示结果** → 如果是新记录则显示祝贺消息

## 需要的文件

### Unity脚本 (放在Assets/Scripts目录)
- `APIManager.cs` - 简化的分数通知管理器
- `gamemanage.cs` - 已修改，在游戏结束时调用分数提交

### 前端代码
- `App.tsx` - 已修改，定义全局函数接收Unity分数

## 集成步骤

### 1. Unity端设置

1. 将 `APIManager.cs` 添加到Unity项目的 `Assets/Scripts/` 目录
2. 在Unity场景中创建一个空GameObject，命名为"APIManager"
3. 将APIManager脚本附加到该GameObject上
4. `gamemanage.cs` 已经修改完成，会在游戏结束时自动通知前端

### 2. 前端设置

前端React应用已经配置完成：
- 定义了全局函数 `window.handleUnityScore(score)`
- 接收Unity分数后自动提交到后端
- 处理新记录提示

### 3. 后端API

使用现有的API端点：
- `POST /api/submit-score` - 提交游戏分数（需要认证token）

## 数据流程

```
Unity Game End
    ↓
Calculate Final Score (单人: playerOneScore, 双人: max(playerOneScore, playerTwoScore))
    ↓
gamemanage.SubmitScoreToBackend(finalScore)
    ↓
APIManager.SubmitScore(roundedScore)
    ↓
Application.ExternalCall("window.handleUnityScore", score)
    ↓
Frontend App.handleUnityScore(score)
    ↓
POST /api/submit-score with user token
    ↓
Backend validates token and updates record if higher
    ↓
Frontend shows result (new record alert if applicable)
```

## 关键特性

- **极简设计**：Unity只需要一行代码调用JavaScript函数
- **无需桥接文件**：不需要额外的JavaScript桥接脚本
- **自动分数精度**：分数自动保留两位小数
- **智能更新**：只有更高分数才会更新用户记录
- **用户体验**：新记录会有祝贺提示

## 调试

### Unity控制台
- `[APIManager] Notifying frontend of new score: XX.XX`
- `[GameManager] Notifying frontend of final score: XX.XX`

### 浏览器控制台
- `[App] Submitting Unity score: XX.XX`
- `[App] Score submitted successfully: {...}`

## 使用方法

1. 用户在React前端登录
2. 开始Unity游戏
3. 游戏结束后，分数自动提交
4. 如果是新记录，会显示祝贺弹窗

就这么简单！没有复杂的配置，没有额外的文件，只需要确保Unity WebGL构建包含在React应用中即可。
