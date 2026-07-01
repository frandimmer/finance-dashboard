import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />;
}

export default function CategoriesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonBox className="h-8 w-36" />
          <SkeletonBox className="mt-2 h-4 w-64" />
        </div>

        <SkeletonBox className="h-10 w-40 rounded-xl" />
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <SkeletonBox className="mb-2 h-3 w-24" />
                <SkeletonBox className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader>
          <SkeletonBox className="h-4 w-28" />
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonBox className="h-11 w-11 rounded-2xl" />

                  <div>
                    <SkeletonBox className="h-4 w-32" />
                    <SkeletonBox className="mt-2 h-3 w-24" />
                  </div>
                </div>

                <SkeletonBox className="h-4 w-4 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}