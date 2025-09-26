import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Sparkles, BookOpen } from 'lucide-react';

const Header: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 shadow-sm">
      <div className="w-full flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-dusty-blue rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-coral-pink rounded-full flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-dusty-blue">
                مسار
              </h1>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">
                Student Assistant
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-warm-cream text-dusty-blue border-0 px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 hover:bg-warm-cream transition-colors duration-200 rounded-lg px-3 py-2"
          >
            <Globe className="h-4 w-4 text-dusty-blue" />
            <span className="text-sm font-medium text-dusty-blue">
              {language === 'en' ? 'العربية' : 'English'}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;