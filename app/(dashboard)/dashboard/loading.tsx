import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <SkeletonBox className="h-8 w-40" />
          <SkeletonBox className="mt-2 h-4 w-56" />
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <SkeletonBox className="h-10 w-36 rounded-xl" />
          <SkeletonBox className="h-7 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card
            key={index}
            className="border border-gray-200 bg-white shadow-none"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <SkeletonBox className="h-4 w-28" />
              <SkeletonBox className="h-4 w-4 rounded-full" />
            </CardHeader>

            <CardContent>
              <SkeletonBox className="h-8 w-36" />
              <SkeletonBox className="mt-3 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <SkeletonBox className="mb-2 h-3 w-24" />
                <SkeletonBox className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border border-gray-200 bg-white shadow-none xl:col-span-2">
          <CardHeader>
            <SkeletonBox className="h-4 w-28" />
          </CardHeader>

          <CardContent>
            <SkeletonBox className="h-72 w-full rounded-2xl" />
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-4 w-4 rounded-full" />
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonBox key={index} className="h-[66px] w-full rounded-2xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <SkeletonBox className="h-4 w-32" />
          <SkeletonBox className="h-4 w-4 rounded-full" />
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBox key={index} className="h-[66px] w-full rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}