import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />;
}

export default function BudgetsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonBox className="h-8 w-44" />
          <SkeletonBox className="mt-2 h-4 w-72" />
        </div>

        <SkeletonBox className="h-10 w-44 rounded-xl" />
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <SkeletonBox className="mb-2 h-3 w-24" />
                <SkeletonBox className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader>
          <SkeletonBox className="h-4 w-40" />
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <SkeletonBox className="h-11 w-11 rounded-2xl" />

                    <div className="min-w-0">
                      <SkeletonBox className="h-4 w-32" />
                      <SkeletonBox className="mt-2 h-3 w-36" />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <SkeletonBox className="h-4 w-10" />
                    <SkeletonBox className="h-4 w-4 rounded-full" />
                  </div>
                </div>

                <div className="mt-4">
                  <SkeletonBox className="h-2 w-full rounded-full" />

                  <div className="mt-3 flex items-center justify-between">
                    <SkeletonBox className="h-3 w-16" />
                    <SkeletonBox className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}