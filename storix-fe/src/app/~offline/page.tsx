export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center">
      <div className="w-full max-w-[320px]">
        <p className="text-xl font-semibold">오프라인 상태예요</p>
        <p className="mt-2 text-sm text-gray-500">
          네트워크가 연결되면 다시 시도해 주세요.
        </p>
      </div>
    </div>
  )
}
