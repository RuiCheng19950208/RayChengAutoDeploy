# 测试文件：演示 Depends 和直接调用的区别

def get_db():
    print("🔌 创建数据库连接")
    return "database_session"

def wrong_way(db = get_db()):
    print(f"❌ 错误方式：{db}")
    return "使用已存在的连接"

def right_way(db = None):
    if db is None:
        db = get_db()
    print(f"✅ 正确方式：{db}")
    return "动态创建连接"

# 测试
print("=== 函数定义阶段 ===")
print("定义 wrong_way 函数...")
print("定义 right_way 函数...")

print("\n=== 函数调用阶段 ===")
print("调用 wrong_way:")
result1 = wrong_way()
print(f"结果: {result1}")

print("\n调用 right_way:")
result2 = right_way()
print(f"结果: {result2}")

print("\n=== 关键区别 ===")
print("❌ wrong_way: get_db() 在函数定义时就执行了")
print("✅ right_way: get_db() 在函数调用时才执行")




