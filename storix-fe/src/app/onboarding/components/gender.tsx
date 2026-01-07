// src/app/onboarding/components/gender.tsx
type GenderValue = 'MALE' | 'FEMALE' | ''

interface GenderProps {
  value: GenderValue
  onChange: (value: GenderValue) => void
}

export default function Gender({ value, onChange }: GenderProps) {
  return (
    <div>
      <h1 className="text-black text-2xl font-bold leading-[140%]">
        성별을 선택하세요
      </h1>

      <p className="text-gray-500 mt-[5px] text-[16px] font-medium leading-[140%]">
        해당 정보는 추천에 활용되며, 언제든 변경할 수 있어요
      </p>

      {/* 성별 선택 버튼 */}
      <div className="mt-20 flex gap-4 justify-center">
        <img
          src={
            value === 'MALE'
              ? '/onboarding/men-pink.svg'
              : '/onboarding/men-gray.svg'
          }
          alt="남성"
          width={174}
          height={28}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onChange('MALE')}
        />

        <img
          src={
            value === 'FEMALE'
              ? '/onboarding/women-pink.svg'
              : '/onboarding/women-gray.svg'
          }
          alt="여성"
          width={174}
          height={28}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onChange('FEMALE')}
        />
      </div>
    </div>
  )
}
