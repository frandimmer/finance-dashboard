import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 ${className}`}
    />
  );
}

export default function CategoriesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonBox className="h-8 w-36" />
          <SkeletonBox className="mt-2 h-4 w-72 max-w-full" />
        </div>

        <SkeletonBox className="h-10 w-44 rounded-xl" />
      </div>

      <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <SkeletonBox className="mb-2 h-3 w-28" />
                <SkeletonBox className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <SkeletonBox className="h-4 w-28" />
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-950/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonBox className="h-11 w-11 shrink-0 rounded-2xl" />

                  <div className="min-w-0">
                    <SkeletonBox className="h-4 w-32" />
                    <SkeletonBox className="mt-2 h-3 w-24" />
                  </div>
                </div>

                <SkeletonBox className="h-8 w-8 rounded-xl" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}