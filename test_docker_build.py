#!/usr/bin/env python3
"""
Docker 镜像构建过程演示
"""

import subprocess
import sys

def run_command(command):
    """运行命令并返回结果"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    print("🐳 Docker 镜像构建过程演示")
    print("=" * 50)
    
    # 1. 检查 Docker 是否运行
    print("1. 检查 Docker 状态...")
    success, stdout, stderr = run_command("docker --version")
    if success:
        print(f"✅ Docker 已安装: {stdout.strip()}")
    else:
        print("❌ Docker 未安装或未运行")
        return
    
    # 2. 查看当前目录的 Dockerfile
    print("\n2. 检查 Dockerfile...")
    success, stdout, stderr = run_command("dir Dockerfile")
    if success:
        print("✅ 找到 Dockerfile")
    else:
        print("❌ 未找到 Dockerfile，请确保在正确目录")
        return
    
    # 3. 查看本地镜像
    print("\n3. 查看本地镜像...")
    success, stdout, stderr = run_command("docker images")
    if success:
        print("📦 本地镜像列表:")
        print(stdout)
    else:
        print("❌ 无法获取镜像列表")
    
    # 4. 构建镜像（可选）
    print("\n4. 镜像构建说明:")
    print("   要构建镜像，请运行:")
    print("   docker build -t ray-cheng-backend .")
    print("\n   要使用 docker-compose 启动服务:")
    print("   docker-compose up -d")
    
    print("\n" + "=" * 50)
    print("🎯 总结:")
    print("   - 镜像在 Dockerfile 中定义")
    print("   - 使用 docker build 构建镜像")
    print("   - 在 docker-compose.yml 中使用镜像")

if __name__ == "__main__":
    main()



