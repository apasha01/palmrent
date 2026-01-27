import { Separator } from "@radix-ui/react-select";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function InformationStepSkeleton() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          {/* green banner skeleton */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-md bg-emerald-200/60" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 bg-emerald-200/60" />
              <Skeleton className="h-3 w-5/6 bg-emerald-200/50" />
            </div>
          </div>

          {/* card 1 */}
          <Card className="border border-gray-200  dark:border-gray-800 rounded-xl shadow-sm">
            <CardHeader className="py-4">
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* card 2 */}
          <Card className="border border-gray-200  dark:border-gray-800 rounded-xl shadow-sm">
            <CardHeader className="py-4">
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* card 3 */}
          <Card className="border border-gray-200  dark:border-gray-800 rounded-xl shadow-sm">
            <CardHeader className="py-4">
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <Skeleton className="h-12 w-full rounded-lg md:col-span-5" />
                <Skeleton className="h-12 w-full rounded-lg md:col-span-4" />
                <Skeleton className="h-12 w-full rounded-lg md:col-span-3" />
              </div>
              <Skeleton className="h-4 w-72 mx-auto" />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-gray-200  dark:border-gray-800 rounded-xl shadow-sm">
            <CardHeader className="py-3">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex gap-3 items-start">
                <Skeleton className="w-28 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200  dark:border-gray-800 rounded-xl shadow-sm">
            <CardHeader className="py-3">
              <Skeleton className="h-4 w-28" />
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>

              <Separator />

              <div className="flex items-end justify-between">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-6 w-24" />
              </div>

              <div className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-52" />
              </div>

              <Skeleton className="h-12 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}