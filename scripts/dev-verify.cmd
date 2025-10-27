@echo off
setlocal
if not exist evidence\local mkdir evidence\local
curl -s http://127.0.0.1:3003/api/public/health > evidence\local\health_web.json 2>nul
curl -s http://127.0.0.1:4001/health > evidence\local\health_exec.json 2>nul
pnpm --filter web-next run build || echo build:web failed > evidence\local\build_fail.txt
pnpm -w run check:fast || echo check:fast failed > evidence\local\check_fail.txt
git log -1 --name-status > evidence\local\git_last_commit.txt 2>nul
git status -s > evidence\local\git_status.txt 2>nul
echo done > evidence\local\_ok.txt

