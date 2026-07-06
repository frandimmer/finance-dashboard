function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />;
}

export default function BudgetsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <SkeletonBox className="h-8 w-44" />
          <SkeletonBox className="mt-3 h-4 w-80 max-w-full" />
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <SkeletonBox className="h-10 w-44" />
          <SkeletonBox className="h-6 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SkeletonBox className="mb-5 h-4 w-24" />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <SkeletonBox className="mb-2 h-3 w-20" />
              <SkeletonBox className="h-5 w-24" />
            </div>

            <div>
              <SkeletonBox className="mb-2 h-3 w-16" />
              <SkeletonBox className="h-5 w-24" />
            </div>

            <div>
              <SkeletonBox className="mb-2 h-3 w-16" />
              <SkeletonBox className="h-5 w-24" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SkeletonBox className="mb-5 h-4 w-24" />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <SkeletonBox className="mb-2 h-3 w-20" />
              <SkeletonBox className="h-5 w-24" />
            </div>

            <div>
              <SkeletonBox className="mb-2 h-3 w-16" />
              <SkeletonBox className="h-5 w-24" />
            </div>

            <div>
              <SkeletonBox className="mb-2 h-3 w-16" />
              <SkeletonBox className="h-5 w-24" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <SkeletonBox className="mb-2 h-3 w-24" />
              <SkeletonBox className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <SkeletonBox className="mb-6 h-4 w-40" />

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-100 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonBox className="h-11 w-11 rounded-2xl" />

                  <div>
                    <SkeletonBox className="h-4 w-32" />
                    <SkeletonBox className="mt-2 h-3 w-44" />
                  </div>
                </div>

                <SkeletonBox className="h-5 w-12" />
              </div>

              <SkeletonBox className="mt-4 h-2 w-full rounded-full" />

              <div className="mt-3 flex items-center justify-between">
                <SkeletonBox className="h-3 w-16" />
                <SkeletonBox className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}