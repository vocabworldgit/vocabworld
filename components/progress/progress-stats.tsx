"use client"
import { useEffect, useState } from "react"
import { Flame, TrendingUp, Trophy, BookOpen, Target } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ProgressStats {
  wordsLearned: number
  wordsLearnedToday: number
  dailyLoginStreak: number
  topicsCompleted: number
  languageCompletionPercentage: number
  totalWordsInLanguage: number
}

export function ProgressStats({ targetLanguageCode, targetLanguageName }: { targetLanguageCode: string, targetLanguageName: string }) {
  const { user } = useAuth()
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id || !targetLanguageCode) {
      setLoading(false)
      return
    }
    
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/progress/stats?userId=${user.id}&targetLanguageCode=${targetLanguageCode}`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch progress stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [user?.id, targetLanguageCode])

  if (!user) return null
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 animate-pulse">
          <div className="h-20 bg-white/5 rounded"></div>
        </div>
      </div>
    )
  }
  
  if (!stats) return null

  return (
    <div className="space-y-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{targetLanguageName} Progress</h3>
            <p className="text-xs text-white/70">{Math.round(stats.languageCompletionPercentage)}% Complete</p>
          </div>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" 
            style={{ width: `${Math.min(stats.languageCompletionPercentage, 100)}%` }} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-2">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.wordsLearned}</div>
          <div className="text-xs text-white/90">Words Learned</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.wordsLearnedToday}</div>
          <div className="text-xs text-white/90">Today</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-2">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.dailyLoginStreak}</div>
          <div className="text-xs text-white/90">Day Streak</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.topicsCompleted}</div>
          <div className="text-xs text-white/90">Topics Done</div>
        </div>
      </div>
    </div>
  )
}
