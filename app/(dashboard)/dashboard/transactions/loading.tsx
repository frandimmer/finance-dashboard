import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />;
}

export default function TransactionsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonBox className="h-8 w-44" />
          <SkeletonBox className="mt-2 h-4 w-56" />
        </div>

        <SkeletonBox className="h-10 w-44 rounded-xl" />
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <SkeletonBox className="mb-2 h-3 w-16" />
            <SkeletonBox className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        <div>
          <SkeletonBox className="mb-2 h-3 w-16" />
          <SkeletonBox className="h-11 w-full rounded-xl" />
        </div>

        <SkeletonBox className="h-11 w-full rounded-xl" />
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <SkeletonBox className="mb-2 h-3 w-20" />
                <SkeletonBox className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader>
          <SkeletonBox className="h-4 w-36" />
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="border-b border-gray-100 px-1 py-3">
              <SkeletonBox className="h-3 w-16" />
            </div>

            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-100 bg-white px-4 py-4"
                >
                  <div className="hidden items-center justify-between sm:flex">
                    <div className="flex flex-col gap-2">
                      <SkeletonBox className="h-4 w-40" />
                      <SkeletonBox className="h-6 w-24 rounded-full" />
                      <SkeletonBox className="h-3 w-32" />
                    </div>

                    <div className="flex items-center gap-2">
                      <SkeletonBox className="h-6 w-24 rounded-full" />
                      <SkeletonBox className="h-4 w-4 rounded-full" />
                      <SkeletonBox className="h-4 w-4 rounded-full" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <SkeletonBox className="h-4 w-40" />
                        <SkeletonBox className="mt-2 h-6 w-24 rounded-full" />
                      </div>

                      <SkeletonBox className="h-4 w-20" />
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <SkeletonBox className="h-3 w-28" />

                      <div className="flex items-center gap-2">
                        <SkeletonBox className="h-4 w-4 rounded-full" />
                        <SkeletonBox className="h-4 w-4 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}