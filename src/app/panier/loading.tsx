export default function Loading() {
  return (
    <main className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-stone-200 rounded w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-sm border border-stone-200">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-stone-200 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-stone-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-stone-200 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-stone-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
