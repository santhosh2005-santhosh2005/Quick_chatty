const MessageSkeleton = () => {
  // Create an array of 6 items for skeleton messages
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-100">
      {skeletonMessages.map((_, idx) => (
        <div key={idx} className={`chat ${idx % 2 === 0 ? "chat-start" : "chat-end"}`}>
          <div className="chat-image avatar">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full">
              <div className="skeleton w-full h-full rounded-full bg-base-300" />
            </div>
          </div>

          <div className="chat-header mb-1">
            <div className="skeleton h-3 w-16 bg-base-300 rounded-full" />
          </div>

          <div className="chat-bubble bg-transparent p-0">
            <div className={`skeleton h-12 ${idx % 2 === 0 ? "w-40 bg-base-200" : "w-32 bg-primary/20"} rounded-xl`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;