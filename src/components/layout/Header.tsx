import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Sparkles, BookOpen, Zap, Star } from 'lucide-react';

const Header: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-glass backdrop-blur-xl shadow-lg">
      <div className="w-full flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-glow group-hover:scale-110 transition-all duration-300">
                <BookOpen className="h-8 w-8 text-white animate-pulse-slow" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce-gentle">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-display text-gradient animate-shimmer">
                مسار
              </h1>
              <span className="text-sm text-white/80 font-medium tracking-wider">
                Student Assistant
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 animate-glow">
            <Star className="h-4 w-4 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
            AI Powered
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-3 bg-white/20 hover:bg-white/30 border-white/30 text-white hover:text-white transition-all duration-300 rounded-xl px-4 py-2 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Globe className="h-5 w-5 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-sm font-semibold">
              {language === 'en' ? 'العربية' : 'English'}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;