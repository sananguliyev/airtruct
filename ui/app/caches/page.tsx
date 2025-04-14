import { MemoryStick } from "lucide-react"

export default function CachesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center justify-center max-w-md text-center p-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-6">
          <MemoryStick className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Caches</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          This feature is currently in development and will be available soon. Stay tuned for updates!
        </p>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
          Coming Soon
        </div>
      </div>
    </div>
  )
}

