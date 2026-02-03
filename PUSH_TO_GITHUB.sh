#!/bin/bash

# Chrome 网络请求分析器 - Git 推送脚本

echo "====================================="
echo "Chrome 网络请求分析器 - Git 推送"
echo "====================================="

# 检查是否在正确的目录
if [ ! -f "manifest.json" ]; then
    echo "❌ 错误：请先进入项目目录 Google/"
    exit 1
fi

# 显示当前 git 状态
echo ""
echo "当前 Git 状态："
git status

echo ""
echo "====================================="
echo "请选择推送方式："
echo "====================================="
echo "1. 使用 HTTPS 推送（需要输入用户名和密码）"
echo "2. 使用 SSH 推送（需要配置 SSH 密钥）"
echo "3. 仅查看远程仓库配置"
echo ""
read -p "请输入选项 (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "配置 HTTPS 远程仓库..."
        git remote add origin https://github.com/weliilam/Google.git
        echo "✅ 远程仓库已添加（HTTPS）"
        echo ""
        echo "正在推送代码..."
        git push -u origin master
        ;;
    2)
        echo ""
        echo "配置 SSH 远程仓库..."
        git remote add origin git@github.com:weliilam/Google.git
        echo "✅ 远程仓库已添加（SSH）"
        echo ""
        echo "正在推送代码..."
        git push -u origin master
        ;;
    3)
        echo ""
        echo "当前远程仓库配置："
        git remote -v
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "====================================="
echo "推送完成！"
echo "====================================="
echo "GitHub 仓库地址："
echo "https://github.com/weliilam/Google.git"
echo ""
echo "访问仓库查看代码："
echo "https://github.com/weliilam/Google"
echo "====================================="
