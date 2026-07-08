import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <SkeletonBox className="h-8 w-40" />
          <SkeletonBox className="mt-2 h-4 w-72 max-w-full" />
        </div>

        <div className="w-full sm:w-80">
          <SkeletonBox className="h-[66px] w-full rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card
            key={index}
            className="overflow-hidden border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900"
          >
            <CardContent className="p-0">
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2">
                    <SkeletonBox className="h-9 w-9 rounded-2xl" />
                    <SkeletonBox className="h-4 w-36" />
                  </div>

                  <SkeletonBox className="h-10 w-56 max-w-full" />
                  <SkeletonBox className="mt-3 h-4 w-44 max-w-full" />
                </div>

                <div className="grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-950/60 sm:min-w-80">
                  {Array.from({ length: 3 }).map((_, itemIndex) => (
                    <div key={itemIndex}>
                      <SkeletonBox className="mb-2 h-3 w-16" />
                      <SkeletonBox className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900"
          >
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-4 w-4 rounded-full" />
              </div>

              <SkeletonBox className="h-7 w-36" />
              <SkeletonBox className="mt-2 h-3 w-44 max-w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <SkeletonBox className="mb-2 h-3 w-28" />
                <SkeletonBox className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="min-w-0 border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">
          <CardHeader>
            <SkeletonBox className="h-4 w-36" />
          </CardHeader>

          <CardContent>
            <SkeletonBox className="h-80 w-full rounded-2xl" />
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-4 w-4 rounded-full" />
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-950/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <SkeletonBox className="h-10 w-10 rounded-2xl" />

                    <div className="min-w-0">
                      <SkeletonBox className="h-4 w-28" />
                      <SkeletonBox className="mt-2 h-3 w-24" />
                    </div>
                  </div>

                  <SkeletonBox className="h-4 w-20 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <SkeletonBox className="h-4 w-36" />
          <SkeletonBox className="h-4 w-4 rounded-full" />
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-950/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonBox className="h-10 w-10 rounded-2xl" />

                  <div className="min-w-0">
                    <SkeletonBox className="h-4 w-40 max-w-full" />
                    <SkeletonBox className="mt-2 h-3 w-36 max-w-full" />
                  </div>
                </div>

                <SkeletonBox className="h-4 w-24 shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}