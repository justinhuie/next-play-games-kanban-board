import { useAuth } from './hooks/useAuth'
import { Board } from './components/Board'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Getting things ready...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Authentication failed</p>
          <p className="text-slate-500 text-sm mt-1">Please refresh the page.</p>
        </div>
      </div>
    )
  }

  return <Board userId={user.id} />
}

export default App
