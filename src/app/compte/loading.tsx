export default function Loading() {
  return (
    <main className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-stone-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-sm border border-stone-200">
              <div className="h-5 bg-stone-200 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-200 rounded w-2/3" />
                <div className="h-4 bg-stone-200 rounded w-1/2" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-sm border border-stone-200">
              <div className="h-5 bg-stone-200 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
