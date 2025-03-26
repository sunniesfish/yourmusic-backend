# YourMusic 백엔드 서비스

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

## 프로젝트 소개

YourMusic은 사용자의 음악 플레이리스트를 관리하고 YouTube와 Spotify 간 플레이리스트 변환을 지원하는 백엔드 서비스입니다. 사용자 인증, 플레이리스트 관리, 음악 통계 등 다양한 기능을 제공합니다.

## 기술 스택

### 핵심 기술

- **TypeScript** - 정적 타입 지원을 통한 안정적인 코드 작성
- **NestJS** - 모듈화된 구조와 의존성 주입을 제공하는 Node.js 서버 프레임워크
- **GraphQL (Apollo)** - REST API 대신 사용하는 효율적인 API 구조
- **TypeORM** - MySQL 데이터베이스 ORM
- **JWT** - 사용자 인증 및 권한 관리

### 인증 및 외부 서비스 연동

- **OAuth2** - Google/YouTube 및 Spotify 인증 통합
- **Passport** - JWT 기반 인증 전략 구현
- **bcrypt** - 비밀번호 해싱 처리

### 웹 스크래핑 및 데이터 처리

- **Puppeteer** - 브라우저 자동화를 통한 웹 스크래핑
- **Worker Threads** - 병렬 처리를 위한 워커 스레드 구현

### 인프라 및 배포

- **Docker / Docker Compose** - 컨테이너화 및 개발/배포 환경 구성
- **MySQL** - 관계형 데이터베이스

## 주요 모듈

- **인증 모듈 (AuthModule)** - 회원가입, 로그인, OAuth 인증 관리
- **사용자 모듈 (UserModule)** - 사용자 계정 및 프로필 관리
- **플레이리스트 모듈 (PlaylistModule)** - 플레이리스트 CRUD 및 변환 기능
- **통계 모듈 (StatisticModule)** - 사용자 음악 통계 관리

## 데이터베이스 구조

- **User** - 사용자 정보 (아이디, 이름, 프로필 이미지, 비밀번호)
- **Playlist** - 플레이리스트 정보 (이름, 노래 목록, 썸네일)
- **Statistic** - 사용자별 음악 통계 (아티스트, 앨범, 노래 순위)
- **RefreshToken** - JWT 리프레시 토큰 관리
- **SpotifyToken** - Spotify API 연동을 위한 토큰 정보
- **YoutubeCredentials** - YouTube API 연동을 위한 인증 정보

## 로컬 개발 환경 설정

### 필수 조건

- Node.js (v16 이상)
- MySQL 데이터베이스
- Docker 및 Docker Compose (선택 사항)

### 설치 및 실행

```bash
의존성 설치
$ npm install
개발 모드로 실행
$ npm run start:dev
프로덕션 빌드
$ npm run build
프로덕션 모드로 실행
$ npm run start:prod
```

### Docker 환경에서 실행

```bash
Docker Compose를 사용하여 서비스 실행
$ docker-compose up
백그라운드에서 실행
$ docker-compose up -d
```

## 환경 변수 설정

애플리케이션은 `.env` 파일 또는 Docker 환경 변수를 통해 다음 설정을 필요로 합니다:

### 기본 설정

- `NODE_ENV` - 실행 환경 (development, production)
- `PORT` - 서버 포트
- `CORS_ORIGIN` - CORS 허용 오리진

### 데이터베이스

- `DB_HOST` - 데이터베이스 호스트
- `DB_PORT` - 데이터베이스 포트
- `DB_USERNAME` - 데이터베이스 사용자
- `DB_PASSWORD` - 데이터베이스 비밀번호
- `DB_DATABASE` - 데이터베이스 이름

### JWT 인증

- `JWT_ACCESS_SECRET` - 액세스 토큰 비밀키
- `JWT_REFRESH_SECRET` - 리프레시 토큰 비밀키

### YouTube API

- `GOOGLE_CLIENT_ID` - Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 클라이언트 시크릿
- `GOOGLE_REDIRECT_URI` - Google OAuth 리디렉션 URI
- `GOOGLE_SCOPE` - Google OAuth 권한 범위
- `YOUTUBE_BASE_URL` - YouTube API 기본 URL
- `YOUTUBE_API_LIMIT_PER_SECOND` - 초당 API 요청 제한
- `YOUTUBE_API_LIMIT_PER_MINUTE` - 분당 API 요청 제한
- `YOUTUBE_API_LIMIT_QUEUE_SIZE` - API 요청 대기열 크기
- `YOUTUBE_BATCH_SIZE` - 배치 처리 크기

### Spotify API

- `SPOTIFY_CLIENT_ID` - Spotify OAuth 클라이언트 ID
- `SPOTIFY_CLIENT_SECRET` - Spotify OAuth 클라이언트 시크릿
- `SPOTIFY_REDIRECT_URI` - Spotify OAuth 리디렉션 URI
- `SPOTIFY_API_ENDPOINT` - Spotify API 엔드포인트
- `SPOTIFY_ADD_SONG_BATCH_SIZE` - 노래 추가 배치 크기
- `SPOTIFY_API_LIMIT_PER_SECOND` - 초당 API 요청 제한
- `SPOTIFY_API_LIMIT_PER_MINUTE` - 분당 API 요청 제한
- `SPOTIFY_API_LIMIT_QUEUE_SIZE` - API 요청 대기열 크기

### 웹 스크래핑 설정

- `MAX_WORKERS` - 최대 워커 수
- `MAX_BROWSERS_PER_WORKER` - 워커당 최대 브라우저 수
- `MAX_CONCURRENT_PAGES` - 최대 동시 페이지 수
- `WORKER_TIMEOUT` - 워커 타임아웃(ms)

## GraphQL API

GraphQL 플레이그라운드를 통해 API를 테스트하고 문서를 확인할 수 있습니다. 개발 환경에서는 `http://localhost:{PORT}/graphql`에서 접근 가능합니다.

### 주요 API 엔드포인트

**인증**

- `signUp` - 회원가입
- `signIn` - 로그인
- `signOut` - 로그아웃
- `checkId` - 아이디 중복 확인
- `changePassword` - 비밀번호 변경

**플레이리스트**

- `playlist` - 단일 플레이리스트 조회
- `playlistsPage` - 페이지네이션된 플레이리스트 목록 조회
- `savePlaylist` - 플레이리스트 저장
- `updatePlaylist` - 플레이리스트 업데이트
- `deletePlaylist` - 플레이리스트 삭제

**통계**

- `statistic` - 사용자 음악 통계 조회

## 마이그레이션

데이터베이스 스키마 마이그레이션:

```bash
프로덕션 환경에서 마이그레이션 실행
$ npm run migration:run:prod
```
