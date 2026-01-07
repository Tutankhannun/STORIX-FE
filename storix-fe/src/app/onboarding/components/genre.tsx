// src/app/onboarding/components/genre.tsx

// ✅ 백엔드 ENUM 값(전송용) 타입
export type GenreKey =
  | 'ROMANCE'
  | 'FANTASY'
  | 'ROFAN'
  | 'HISTORICAL'
  | 'DRAMA'
  | 'THRILLER'
  | 'ACTION'
  | 'BL'
  | 'MODERN_FANTASY'
  | 'DAILY' // ✅ 라노벨용 매핑 추가

interface GenreProps {
  // ✅ value는 백엔드로 보낼 ENUM 키 배열
  value: GenreKey[]
  onChange: (value: GenreKey[]) => void
}

// ✅ UI 표시(label)와 API 전송(key)을 분리
const GENRE_OPTIONS: Array<{ key: GenreKey; label: string }> = [
  { key: 'ROMANCE', label: '로맨스' },
  { key: 'ROFAN', label: '로판' },
  { key: 'BL', label: 'BL' },
  { key: 'FANTASY', label: '판타지' },
  { key: 'MODERN_FANTASY', label: '현판' },
  { key: 'HISTORICAL', label: '무협' },

  // ✅ 라노벨을 화면에 보이게 하고, 백엔드에는 DAILY로 전송
  { key: 'DAILY', label: '라노벨' },

  { key: 'DRAMA', label: '드라마' },
  { key: 'THRILLER', label: '미스터리' },

  // ⚠️ ACTION이 백엔드에서 실제로 허용된다면 UI에 추가 가능
  // { key: 'ACTION', label: '액션' },
]

const MAX_GENRE_SELECTION = 3

export default function Genre({ value, onChange }: GenreProps) {
  const handleGenreClick = (genreKey: GenreKey) => {
    if (value.includes(genreKey)) {
      // 이미 선택된 장르 제거
      onChange(value.filter((g) => g !== genreKey))
    } else {
      // 최대 3개까지만 선택 가능
      if (value.length < MAX_GENRE_SELECTION) {
        onChange([...value, genreKey])
      }
    }
  }

  return (
    <div>
      <h1
        className="text-black text-2xl font-bold"
        style={{
          fontFamily: 'SUIT',
          fontSize: '24px',
          fontWeight: 700,
          lineHeight: '140%',
        }}
      >
        평소 즐겨보는 장르를 선택하세요
      </h1>

      <p
        className="text-gray-500 mt-[5px]"
        style={{
          fontFamily: 'SUIT',
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: '140%',
        }}
      >
        선택 장르를 기반으로 웹툰/웹소설을 추천드려요
      </p>

      {/* 선택된 장르 개수 표시 */}
      <div className="mt-4">
        <span className="text-sm text-gray-600">
          {value.length}/{MAX_GENRE_SELECTION} 선택됨
        </span>
      </div>

      {/* 장르 선택 그리드 */}
      <div className="mt-16 grid grid-cols-3 gap-x-4 gap-y-7">
        {GENRE_OPTIONS.map(({ key, label }) => {
          const isSelected = value.includes(key)
          const isDisabled = !isSelected && value.length >= MAX_GENRE_SELECTION

          return (
            <div
              key={key}
              className={`flex flex-col items-center transition-opacity ${
                isDisabled
                  ? 'cursor-not-allowed opacity-30'
                  : 'cursor-pointer hover:opacity-80'
              }`}
              onClick={() => !isDisabled && handleGenreClick(key)}
            >
              <img
                src="/onboarding/genre-select.svg"
                alt={label}
                width={80}
                height={80}
                className={isSelected ? 'opacity-100' : 'opacity-50'}
              />
              <p
                className="text-gray-900 text-center mt-3"
                style={{
                  fontFamily: 'SUIT',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '140%',
                }}
              >
                {label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
