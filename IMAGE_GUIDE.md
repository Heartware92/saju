# 🎨 이미지 자산 준비 가이드

## 📋 필요한 이미지 목록

### 1. 엽전 이미지 (최우선) ⭐⭐⭐⭐⭐

#### 필요 파일
```
public/images/coins/
  ├── yeopjeon-bronze.png    # 평민 패키지 (1엽전)
  ├── yeopjeon-silver.png    # 중인/양반 패키지 (3-7엽전)
  └── yeopjeon-gold.png      # 판서 패키지 (10-15엽전)
```

#### 사양
- **크기**: 256x256px ~ 512x512px
- **포맷**: PNG (투명 배경) 또는 WebP
- **스타일**: 조선시대 상평통보 엽전 (실사 또는 일러스트)
- **색상**:
  - Bronze: 어두운 구리색 (#8B4513 계열)
  - Silver: 은색/회색 (#9E9E9E 계열)
  - Gold: 금색 (#D4A574 계열)

---

## 🔍 이미지 획득 방법

### 방법 1: 무료 이미지 사이트에서 다운로드

#### 추천 사이트
1. **Unsplash** (무료, 상업적 이용 가능)
   - https://unsplash.com/
   - 검색어: "korean coin", "ancient coin", "old coin"

2. **Pixabay** (무료, CC0 라이선스)
   - https://pixabay.com/
   - 검색어: "상평통보", "korean old coin"

3. **Pexels** (무료, 상업적 이용 가능)
   - https://www.pexels.com/
   - 검색어: "coin", "ancient currency"

4. **한국문화재재단**
   - https://www.chf.or.kr/
   - 문화재 사진 아카이브 (저작권 확인 필요)

5. **Flaticon** (무료/유료, 아이콘)
   - https://www.flaticon.com/
   - 검색어: "coin icon"
   - 귀속 표시 필요 (무료 플랜)

---

### 방법 2: AI 이미지 생성 (추천!)

#### 무료 AI 도구
1. **Microsoft Bing Image Creator** (무료, GPT-4 기반)
   - https://www.bing.com/create
   - 프롬프트 예시:
     ```
     A traditional Korean Sangpyeong Tongbo coin from Joseon dynasty,
     circular shape with square hole in center, bronze color,
     realistic 3D render, isolated on transparent background,
     top view, high quality
     ```

2. **Leonardo.ai** (무료 티어 있음)
   - https://leonardo.ai/
   - 하루 150 크레딧 무료

3. **Ideogram** (무료)
   - https://ideogram.ai/
   - 텍스트 포함 이미지 생성에 강함

#### 유료 AI 도구 (더 높은 퀄리티)
1. **Midjourney** ($10/월)
   - https://www.midjourney.com/
   - 프롬프트 예시:
     ```
     ancient korean sangpyeong coin, bronze metal texture,
     circular with square center hole, top down view,
     cinematic lighting, 4k, isolated white background --ar 1:1
     ```

2. **DALL-E 3** (ChatGPT Plus $20/월)
   - https://chat.openai.com/
   - 가장 정확한 프롬프트 이해

---

### 방법 3: 직접 디자인 (무료 툴)

1. **Canva** (무료/유료)
   - https://www.canva.com/
   - 템플릿: "Coin Logo" 검색
   - 조선 전통색 적용 (#8B4513, #D4A574)

2. **Figma** (무료)
   - https://www.figma.com/
   - 벡터 디자인 가능
   - 플러그인: "Remove BG" (배경 제거)

3. **Photopea** (무료, 웹 기반 포토샵)
   - https://www.photopea.com/
   - PSD 파일 편집 가능

---

## 🎯 실제 이미지 적용 방법

### 1. 이미지 다운로드 후 저장
```bash
# 프로젝트 폴더에 이미지 저장
public/images/coins/
  ├── yeopjeon-bronze.png
  ├── yeopjeon-silver.png
  └── yeopjeon-gold.png
```

### 2. YeopjeonIcon 컴포넌트 활성화
```typescript
// src/components/ui/YeopjeonIcon.tsx
const useImage = true; // false → true로 변경
```

### 3. 이미지 최적화 (선택사항)
- **TinyPNG**: https://tinypng.com/ (PNG 압축)
- **Squoosh**: https://squoosh.app/ (WebP 변환)

---

## 🖼️ 기타 이미지

### 한지 텍스처
**검색어**: "hanji paper texture", "beige paper texture"
**사이트**: Unsplash, Pexels
**저장 위치**: `public/images/textures/hanji-texture.webp`

### 파비콘
**도구**:
- https://favicon.io/ (이모지 → 파비콘)
- https://realfavicongenerator.net/

**추천**: ☯ 태극 또는 엽전 이미지 사용

### OG 이미지 (SNS 공유용)
**크기**: 1200x630px
**도구**: Canva, Figma
**내용**:
- 서비스명: "사주 운세"
- 부제: "엽전으로 더 깊은 운세를"
- 엽전 이미지 + 한지 배경

---

## 📝 AI 프롬프트 템플릿

### 엽전 이미지 생성용 프롬프트

#### Bronze (평민)
```
A traditional Korean Sangpyeong Tongbo coin from Joseon dynasty,
circular bronze coin with square hole in center,
aged bronze patina, realistic texture,
isolated on transparent background, top view,
high resolution, product photography style
```

#### Silver (중인/양반)
```
Ancient Korean coin with silver tone finish,
circular shape with square center hole,
polished metal surface with slight wear,
traditional Korean currency design,
isolated transparent background, 4k quality
```

#### Gold (판서)
```
Luxurious gold-toned Korean traditional coin,
Sangpyeong Tongbo design, circular with square hole,
shiny gold finish with subtle engravings,
premium quality render, cinematic lighting,
transparent background, ultra high resolution
```

---

## ⚠️ 저작권 주의사항

1. **CC0 / Public Domain** 이미지만 사용 (상업적 이용 가능)
2. **귀속 표시** 필요 시 Footer에 크레딧 추가
3. **AI 생성 이미지**는 일반적으로 상업적 이용 가능 (각 플랫폼 정책 확인)

---

## 🚀 빠른 시작

**가장 빠른 방법**:

1. Microsoft Bing Image Creator 접속
2. 위 프롬프트 복사 & 생성
3. 투명 배경으로 다운로드
4. `public/images/coins/` 폴더에 저장
5. `YeopjeonIcon.tsx`에서 `useImage = true` 설정
6. 완료!

---

현재는 이모지(🪙)를 CSS로 스타일링해서 사용 중이므로,
이미지 없이도 개발을 계속 진행할 수 있습니다.
