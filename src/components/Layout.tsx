import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, 
  Settings, 
  User, 
  LogOut, 
  Bell,
  Search,
  Plus,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onOpenSettings?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onOpenSettings }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  StudyCard Creator
                </h1>
                <div className="flex items-center text-xs text-gray-500">
                  <Sparkles className="w-3 h-3 mr-1 text-yellow-500" />
                  AI-Powered
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cards, decks, or templates..."
                  className="w-full pl-10 pr-4 py-2 bg-white/60 border border-white/40 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all duration-200 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-3">
              {/* Quick Actions */}
              <button className="hidden sm:flex items-center space-x-2 btn-primary text-sm">
                <Plus className="w-4 h-4" />
                <span>New Card</span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-white/60 rounded-lg transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 hover:bg-white/60 rounded-lg transition-all duration-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.email?.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 glass-effect rounded-lg shadow-lg border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-white/20">
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    </div>
                    <button
                      onClick={onOpenSettings}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-white/60 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    <button
                      onClick={signOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/4 w-60 h-60 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};