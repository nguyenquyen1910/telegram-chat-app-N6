set -e

if [ -z "$1" ]; then
  echo ""
  echo "   Thiếu UID."
  echo ""
  echo "  Cách dùng: ./scripts/seedCalls.sh <YOUR_UID>"
  echo ""
  echo "  Lấy UID:"
  echo "    - Firebase Console → Authentication → Users → cột 'User UID'"
  echo "    - Hoặc in trong app: console.log(auth.currentUser?.uid)"
  echo ""
  exit 1
fi

UID_ARG="$1"

echo ""
echo ".   Bắt đầu seed dữ liệu cuộc gọi mẫu..."
echo "    UID: $UID_ARG"
echo ""

NODE_VERSION=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")

if [ "$NODE_VERSION" -lt 18 ]; then
  echo "   Node.js version $NODE_VERSION < 18. fetch() chưa có sẵn."
  echo "   Hãy update Node: https://nodejs.org"
  exit 1
fi

node "$(dirname "$0")/seedCalls.js" "$UID_ARG"
