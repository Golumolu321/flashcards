import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Deck, Card, Folder } from '../../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Folder as FolderIcon,
  BookOpen,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  Users,
  Zap,
  Target,
  Brain,
  Lightbulb
} from 'lucide-react';

interface DashboardProps {
  onOpenCardEditor: (card: Card) => void;
  onOpenTemplateLibrary: () => void;
  onOpenAIImport: () => void;
  onOpenShare: (resource: Deck | Folder, type: 'deck' | 'folder') => void;
  onOpenPrintPreview: (deck: Deck, cards: Card[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenCardEditor,
  onOpenTemplateLibrary,
  onOpenAIImport,
  onOpenShare,
  onOpenPrintPreview
}) => {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [recentCards, setRecentCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch decks
      const { data: decksData } = await supabase
        .from('decks')
        .select('*')
        .eq('owner_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(6);

      // Fetch recent cards
      const { data: cardsData } = await supabase
        .from('cards')
        .select('*, decks!inner(name, owner_id)')
        .eq('decks.owner_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      setDecks(decksData || []);
      setRecentCards(cardsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Decks', value: decks.length, icon: BookOpen, color: 'blue' },
    { label: 'Cards Created', value: recentCards.length * 4, icon: Target, color: 'green' },
    { label: 'Study Sessions', value: 12, icon: Brain, color: 'purple' },
    { label: 'AI Imports', value: 3, icon: Sparkles, color: 'yellow' }
  ];

  const quickActions = [
    {
      title: 'Create New Deck',
      description: 'Start with a blank deck',
      icon: Plus,
      color: 'blue',
      action: () => console.log('Create deck')
    },
    {
      title: 'Browse Templates',
      description: 'Use pre-made templates',
      icon: Star,
      color: 'purple',
      action: onOpenTemplateLibrary
    },
    {
      title: 'AI Import',
      description: 'Extract from PDF/images',
      icon: Zap,
      color: 'yellow',
      action: onOpenAIImport
    },
    {
      title: 'Study Mode',
      description: 'Practice with your cards',
      icon: Lightbulb,
      color: 'green',
      action: () => console.log('Study mode')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden">
        <div className="card p-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user?.email?.split('@')[0]}! 👋
                </h1>
                <p className="text-blue-100 text-lg">
                  Ready to create some amazing study cards?
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card card-hover p-6 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={action.action}
                className="card card-hover p-6 text-left group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex p-3 rounded-xl bg-${action.color}-100 mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-6 h-6 text-${action.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Decks */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Decks</h2>
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Deck
            </button>
          </div>
        </div>

        {decks.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No decks yet</h3>
            <p className="text-gray-600 mb-6">Create your first deck to get started with studying!</p>
            <button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Deck
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {decks.map((deck, index) => (
              <div 
                key={deck.id} 
                className="card card-hover p-6 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{deck.name}</h3>
                      <p className="text-sm text-gray-600">{deck.card_size} cards</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Users className="w-4 h-4" />
                  </button>
                </div>
                
                {deck.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{deck.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(deck.updated_at).toLocaleDateString()}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                    {Math.floor(Math.random() * 20) + 5} cards
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentCards.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="card p-6">
            <div className="space-y-4">
              {recentCards.map((card, index) => (
                <div 
                  key={card.id} 
                  className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {card.title || 'Untitled Card'}
                    </p>
                    <p className="text-sm text-gray-600">
                      in {(card as any).decks?.name || 'Unknown Deck'}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(card.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};