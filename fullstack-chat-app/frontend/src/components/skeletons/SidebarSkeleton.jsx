import { Users } from "lucide-react";

const SidebarSkeleton = () => {
  // Create 8 skeleton items
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside
      className="h-full w-20 lg:w-80 border-r border-base-300 
    flex flex-col transition-all duration-200 bg-base-100"
    >
      {/* Header */}
      <div className="border-b border-base-300 w-full p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <span className="font-semibold hidden lg:block">Contacts</span>
        </div>
        
        {/* Search Bar Skeleton */}
        <div className="relative">
          <div className="skeleton h-10 rounded-lg bg-base-200" />
        </div>

        {/* Online filter toggle Skeleton */}
        <div className="flex items-center justify-between">
          <div className="skeleton h-5 w-24 rounded-full bg-base-200" />
          <div className="skeleton h-5 w-16 rounded-full bg-base-200" />
        </div>
      </div>

      {/* Skeleton Contacts */}
      <div className="overflow-y-auto w-full py-3">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-3 flex items-center gap-3 hover:bg-base-200/50">
            {/* Avatar skeleton */}
            <div className="relative mx-auto lg:mx-0">
              <div className="skeleton w-10 h-10 rounded-full bg-base-200" />
            </div>

            {/* User info skeleton - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0 flex-1">
              <div className="skeleton h-4 w-32 mb-2 bg-base-200 rounded-full" />
              <div className="skeleton h-3 w-16 bg-base-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;