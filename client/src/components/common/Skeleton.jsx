const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const CourseCardSkeleton = () => (
  <div className="card">
    <Skeleton className="w-full h-44" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {[...Array(6)].map((_, i) => <CourseCardSkeleton key={i} />)}
    </div>
  </div>
);

export default Skeleton;
