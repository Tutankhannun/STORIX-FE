// src/app/onboarding/components/nickname.tsx
'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  checkNicknameValid,
  // checkNicknameForbidden,  // (보류)
  extractIsAvailableFromValidResponse,
  // extractIsForbiddenFromForbiddenResponse, // (보류)
} from '@/api/auth/nickname.api'

interface NicknameProps {
  value: string
  onChange: (value: string) => void
  onAvailabilityChange?: (ok: boolean) => void
}

type Status =
  | 'idle'
  | 'typing'
  | 'invalid_chars'
  | 'length_basic' // 0~1글자 기본 경고
  | 'spaces_only'
  | 'forbidden'
  | 'unchecked'
  | 'checking'
  | 'ok'
  | 'taken'

type MsgType = 'none' | 'basic' | 'toast' | 'error' | 'success'

const MIN = 2
const MAX = 10

const MSG_LEN = '한글,영문,숫자 2~10자까지 입력 가능해요'
const MSG_CHARS = '닉네임은 한글/영문/숫자/_ 만 가능해요!'
const MSG_SPACES = '공백만으론 닉네임을 설정할 수 없어요!'
const MSG_OK = '사용 가능한 닉네임이에요'
const MSG_TAKEN = '이미 사용 중인 닉네임이에요'

export default function Nickname({
  value,
  onChange,
  onAvailabilityChange,
}: NicknameProps) {
  const [focused, setFocused] = useState(false)
  const [status, setStatus] = useState<Status>('idle')

  // 메시지/종류 분리(기본 길이 경고 vs 11번째 토스트)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<MsgType>('none')

  const lastChecked = useRef('')

  // 11번째 입력 시도 토스트 타이머
  const maxToastTimer = useRef<number | null>(null)

  // debounce 금칙어 체크 타이머
  const forbiddenTimer = useRef<number | null>(null)

  // ✅ 허용: 한글/영문/숫자/_ + 공백(허용)
  // 요구사항: ^[ㄱ-ㅎ가-힣a-zA-Z0-9_]+$ 에 "공백도 가능"을 반영하여 스페이스 포함
  const allowedRegex = /^[ㄱ-ㅎ가-힣a-zA-Z0-9_ ]+$/

  const isAllSpaces = (v: string) => v.length > 0 && v.trim().length === 0

  const isBasicValid = (v: string) =>
    v.length >= MIN &&
    v.length <= MAX &&
    !isAllSpaces(v) &&
    allowedRegex.test(v)

  const clearMaxToast = () => {
    if (maxToastTimer.current) {
      window.clearTimeout(maxToastTimer.current)
      maxToastTimer.current = null
    }
  }

  const showMaxToast = () => {
    // 11번째 입력 시도: 토스트 1.5초 ~
    setMsg(MSG_LEN)
    setMsgType('toast')

    clearMaxToast()
    maxToastTimer.current = window.setTimeout(() => {
      setMsgType((prev) => (prev === 'toast' ? 'none' : prev))
      setMsg((prev) => (prev === MSG_LEN ? '' : prev))
      maxToastTimer.current = null
    }, 1500)
  }

  const setAvailabilityFalse = () => {
    onAvailabilityChange?.(false)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('signup_nickname_available', 'false')
    }
  }

  const resetCheck = () => {
    lastChecked.current = ''
    setAvailabilityFalse()
  }

  const setBasicLengthWarning = () => {
    // 0~1 글자: 계속 떠야 하는 기본 경고
    setStatus('length_basic')
    setMsg(MSG_LEN)
    setMsgType('basic')
  }

  const clearIfBasicLengthWarning = () => {
    // 2글자 되면 기본 길이 경고는 즉시 사라져야 함
    if (msgType === 'basic' && msg === MSG_LEN) {
      setMsg('')
      setMsgType('none')
    }
  }

  const handleChange = (raw: string) => {
    // ✅ 11번째 입력 시도 감지: "이미 10자"인데 "raw는 10자 초과"
    if (value.length === MAX && raw.length > MAX) {
      showMaxToast()
    }

    const next = raw.slice(0, MAX)

    // ✅ 값이 바뀌면(=중복체크 결과 무효) 다음 버튼 비활성화
    // (10자 초과 시도는 실제 값 변화가 없으므로 resetCheck가 과하게 호출될 수 있지만,
    //  UX상 '사용 가능' 상태에서 더 입력하려다 막혔다고 해서 결과를 무효화할 필요는 없음)
    if (next !== value) resetCheck()

    // ✅ 로컬 저장 (프로필에서 바로 읽어 쓸 값)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('signup_nickname', next)
    }

    if (!next) {
      setStatus('idle')
      setMsg('')
      setMsgType('none')
      onChange(next)
      return
    }

    // 공백만: 입력은 허용하되, debounce에서 멈추면 에러 표시
    if (isAllSpaces(next)) {
      setStatus('typing')
      // 공백만 에러가 debounce에서 뜰 거라 기본 메시지 일단 제거
      if (msgType !== 'toast') {
        setMsg('')
        setMsgType('none')
      }
      onChange(next)
      return
    }

    // 허용 문자 외: 즉시 필터링 + 에러
    if (!allowedRegex.test(next)) {
      const filtered = next
        .replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9_ ]/g, '')
        .slice(0, MAX)
      onChange(filtered)

      if (!filtered) {
        setStatus('idle')
        setMsg('')
        setMsgType('none')
        return
      }

      setStatus('invalid_chars')
      setMsg(MSG_CHARS)
      setMsgType('error')
      return
    }

    // 0~1 글자: 기본 길이 경고 유지
    if (next.length < MIN) {
      onChange(next)
      setBasicLengthWarning()
      return
    }

    // ✅ 2글자 이상이면 기본 길이 경고는 즉시 사라져야 함
    onChange(next)
    clearIfBasicLengthWarning()

    // ✅ 기본 정합성 OK (중복체크 전)
    setStatus('unchecked')
    // 토스트(11번째)는 1.5초 후 자동 제거
  }

  /** ✅ debounce(400ms): 공백만 / 금칙어 체크 */
  useEffect(() => {
    if (!value) return

    // 기존 타이머 정리
    if (forbiddenTimer.current) {
      window.clearTimeout(forbiddenTimer.current)
      forbiddenTimer.current = null
    }

    forbiddenTimer.current = window.setTimeout(async () => {
      // 공백만 닉네임 금지
      if (isAllSpaces(value)) {
        setStatus('spaces_only')
        setMsg(MSG_SPACES)
        setMsgType('error')
        return
      }

      // 0~1글자면 기본 길이 경고
      if (value.length < MIN) {
        setBasicLengthWarning()
        return
      }

      // 허용 문자 아니면 invalid_chars가 이미 잡았을 가능성 높지만 안전망
      if (!allowedRegex.test(value)) {
        setStatus('invalid_chars')
        setMsg(MSG_CHARS)
        setMsgType('error')
        return
      }

      // ✅ 2~10자 & 허용문자 OK → 기본 길이 경고는 즉시 사라져야 함
      clearIfBasicLengthWarning()

      // ✅ 금칙어 체크 API 호출 (요구사항: debounce로 호출)
      // try {
      //   const data = await checkNicknameForbidden(value)
      //   const { forbidden, message } =
      //     extractIsForbiddenFromForbiddenResponse(data)

      //   if (forbidden) {
      //     setStatus('forbidden')
      //     setMsg(message || '사용할 수 없는 닉네임이에요!')
      //     setMsgType('error')
      //     // 금칙어 걸리면 아이콘 gray + 중복체크 불가 상태가 자연스러움
      //     setAvailabilityFalse()
      //     return
      //   }

      //   // 금칙어 OK면 forbidden 상태였다면 unchecked로 복구 (중복체크 전 상태)
      //   setStatus((prev) => (prev === 'forbidden' ? 'unchecked' : prev))
      //   // 에러 메시지가 금칙어 메시지였다면 제거 (토스트/다른 메시지는 유지)
      //   setMsg((prev) => {
      //     if (msgType === 'toast') return prev
      //     if (prev && prev !== MSG_OK) return ''
      //     return prev
      //   })
      //   if (msgType !== 'toast') setMsgType('none')
      // } catch {
      //   // 금칙어 API가 아직 없거나 실패해도 UX 유지 (무시)
      // }
    }, 400)

    return () => {
      if (forbiddenTimer.current) {
        window.clearTimeout(forbiddenTimer.current)
        forbiddenTimer.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // unmount 시 타이머 정리
  useEffect(() => {
    return () => {
      clearMaxToast()
      if (forbiddenTimer.current) window.clearTimeout(forbiddenTimer.current)
    }
  }, [])

  const canCheck = status === 'unchecked' && isBasicValid(value)

  /** ✅ 버튼 클릭 시에만 중복 체크 API 호출 */
  const checkDuplicate = async () => {
    if (!canCheck) return

    setStatus('checking')
    setMsg('')
    setMsgType('none')

    try {
      const data = await checkNicknameValid(value)
      const available = extractIsAvailableFromValidResponse(data)

      if (available) {
        lastChecked.current = value
        setStatus('ok')
        setMsg(MSG_OK)
        setMsgType('success')
        onAvailabilityChange?.(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('signup_nickname_available', 'true')
        }
      } else {
        setStatus('taken')
        setMsg(MSG_TAKEN)
        setMsgType('error')
        setAvailabilityFalse()
      }
    } catch {
      setStatus('taken')
      setMsg('닉네임 확인 중 오류가 발생했어요. 다시 시도해주세요.')
      setMsgType('error')
      setAvailabilityFalse()
    }
  }

  const isWarning =
    status === 'length_basic' ||
    status === 'invalid_chars' ||
    status === 'spaces_only' ||
    status === 'forbidden' ||
    status === 'taken'

  const isSuccess = status === 'ok'

  // ✅ 밑줄(underline)만 상태에 따라 변경
  const underlineClass = isSuccess
    ? 'border-b-2 border-[var(--color-success)]'
    : isWarning
      ? 'border-b-2 border-[var(--color-warning)]'
      : focused
        ? 'border-b border-[var(--color-black)]'
        : 'border-b border-[var(--color-gray-300)]'

  // ✅ 입력 글자는 항상 검은색(placeholder는 회색)
  const inputTextColor =
    focused || value
      ? 'text-[var(--color-black)]'
      : 'text-[var(--color-gray-300)]'

  // ✅ 아이콘: 경고/에러면 gray, 입력 있고 에러 없으면 pink
  const iconSrc =
    value && !isWarning
      ? '/onboarding/id-check-pink.svg'
      : '/onboarding/id-check-gray.svg'

  const msgColorClass =
    msgType === 'success'
      ? 'text-[var(--color-success)]'
      : msg
        ? 'text-[var(--color-warning)]'
        : ''

  return (
    <div>
      <h1 className="heading-1 text-black">닉네임을 입력하세요</h1>

      <p className="body-1 text-[var(--color-gray-500)] mt-[5px]">
        10자 이내의 닉네임을 입력해주세요
      </p>

      <div className="mt-[80px] w-[361px]">
        <div className="h-[42px] flex items-center justify-between">
          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (canCheck) {
                  checkDuplicate()
                }
              }
            }}
            maxLength={MAX}
            placeholder="닉네임을 입력하세요"
            className={[
              'w-[254px]',
              'px-[8px] py-[10px]',
              'bg-transparent outline-none cursor-text',
              'body-1',
              'placeholder:text-[var(--color-gray-300)]',
              underlineClass,
              inputTextColor,
            ].join(' ')}
          />

          <button
            type="button"
            onClick={checkDuplicate}
            disabled={!canCheck}
            className={[
              'w-[102px] h-[38px]',
              canCheck ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
            ].join(' ')}
            aria-label="닉네임 중복 확인"
          >
            <Image
              src={iconSrc}
              alt=""
              width={102}
              height={38}
              draggable={false}
            />
          </button>
        </div>

        {msg && (
          <p
            className={['caption-1', 'mt-[6px] ml-[8px]', msgColorClass].join(
              ' ',
            )}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}
