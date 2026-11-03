# 맥미니를 WIDEN 서버로 쓰기

맥미니 한 대가 대시보드를 띄우고 팀의 작업 기록(할 일 상태 · 업로드 체크 · 즐겨찾기 · 방문 기록)을 저장한다.
다른 사람은 브라우저로 맥미니 주소에 접속하면 같은 기록을 본다. 추가 설치물은 Node.js 하나.

## 1. 설치 (맥미니에서 한 번)

```bash
# Node.js LTS가 없으면 https://nodejs.org 에서 설치
git clone https://github.com/sungsulee1190-star/widen_cosmetic.git ~/widen_cosmetic
cd ~/widen_cosmetic
bash server/install-mac.sh 원하는접속코드
```

- 로그인하면 자동으로 켜지고, 꺼지면 자동으로 다시 켜진다.
- 맥미니가 잠자기에 들어가면 접속이 끊긴다: **시스템 설정 → 에너지 → "디스플레이가 꺼져 있을 때 자동으로 잠자기 방지"** 를 켠다.

## 2. 접속

| 어디서 | 주소 |
|---|---|
| 맥미니 자신 | `http://localhost:8080` |
| 같은 와이파이 | `http://<맥미니이름>.local:8080` (설치 스크립트가 알려줌) |
| 밖에서 (권장: Tailscale) | 맥미니와 휴대폰/노트북에 Tailscale 설치 → `http://<맥미니-tailscale-이름>:8080` |

처음 접속하면 **데이터 관리 → 작업 기록 저장소**에서 작성자 이름과 접속 코드를 넣는다.
사이드바 아래에 "👥 WIDEN 서버에 저장"이 보이면 공유 중이다.
예전에 브라우저에만 쌓인 기록은 **이 브라우저 기록을 공유 저장소로 복사**로 올린다.

## 3. 관리

```bash
# 최신 코드 받기 (서버 재시작)
cd ~/widen_cosmetic && git pull && launchctl kickstart -k gui/$(id -u)/com.widen.dashboard
# 끄기
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.widen.dashboard.plist
# 로그
tail -f ~/widen_cosmetic/var/server.log
```

- 기록 파일: `~/widen_cosmetic/var/work-log.jsonl` (한 줄 = 한 기록, 지우거나 고치지 않음). **이 파일만 백업하면 된다** (Time Machine 또는 Drive 복사).
- 공유기 포트포워딩으로 인터넷에 직접 열지 않는다. 밖에서는 Tailscale처럼 사설 네트워크로 접속한다.
