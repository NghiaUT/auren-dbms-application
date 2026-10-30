echo "Đang khởi động backend..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "Đang khởi động frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

cleanup() {
    echo "Đang dừng cả Frontend và Backend..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

trap cleanup SIGINT

wait