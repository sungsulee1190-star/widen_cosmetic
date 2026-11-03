#!/bin/bash
# 맥미니에 WIDEN 서버를 상시 실행으로 설치 (로그인하면 자동 시작, 죽으면 재시작).
# 사용: bash server/install-mac.sh [접속코드]
#   접속코드를 주면 그 코드를 아는 사람만 기록을 읽고 쓸 수 있다 (권장).
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node || true)"
TOKEN="${1:-}"
PLIST="$HOME/Library/LaunchAgents/com.widen.dashboard.plist"

if [ -z "$NODE" ]; then
  echo "Node.js가 없습니다. https://nodejs.org 에서 LTS를 설치한 뒤 다시 실행하세요." >&2
  exit 1
fi

mkdir -p "$REPO/var" "$HOME/Library/LaunchAgents"
sed -e "s#__REPO__#$REPO#g" -e "s#__NODE__#$NODE#g" -e "s#__TOKEN__#$TOKEN#g" \
  "$REPO/server/com.widen.dashboard.plist" > "$PLIST"
chmod 600 "$PLIST"

launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

sleep 1
if curl -fsS "http://localhost:8080/api/health" >/dev/null; then
  echo "✅ WIDEN 서버 실행 중"
  echo "   이 맥에서:        http://localhost:8080"
  echo "   같은 와이파이에서: http://$(scutil --get LocalHostName 2>/dev/null || hostname).local:8080"
  [ -n "$TOKEN" ] && echo "   접속 코드: 데이터 관리 화면에 입력 (설정됨)"
  echo "   기록 파일: $REPO/var/work-log.jsonl"
else
  echo "⚠️ 서버 응답이 없습니다. 로그 확인: $REPO/var/server.log" >&2
  exit 1
fi
