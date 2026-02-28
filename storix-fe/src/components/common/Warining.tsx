// src/components/common/Warining.tsx
'use client'


type WarningProps = {
  title: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  className?: string
}

export default function Warning({
  title,
  description,
  buttonText,
  onButtonClick,
  className = '',
}: WarningProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-3 mt-48 px-4 ${className}`}
    >
      <img src="/common/icons/warningLarge.svg" alt="??" width="120" height="120" loading="lazy" />

      <div className="flex flex-col items-center mt-2.5 gap-1">
        <p className="heading-2 text-black text-center whitespace-pre-line">
          {title}
        </p>
        {description ? (
          <p className="body-2 text-gray-500">{description}</p>
        ) : null}
      </div>
      {/* 버튼 (옵션) */}
      {buttonText ? (
        <button
          type="button"
          onClick={onButtonClick}
          className={[
            'inline-flex items-center justify-center',
            'rounded-sm',
            'border border-magenta-100 bg-[var(--color-magenta-20)]',
            'px-2 py-1.5',
            'body-2 text-[var(--color-magenta-300)]',
            'active:scale-[0.98] transition-transform cursor-pointer',
          ].join(' ')}
        >
          {buttonText}
        </button>
      ) : null}
    </div>
  )
}
