import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Home, Upload, FileText, Bell, Calendar } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Navigation: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: t('dashboard') },
    { path: '/schedule-upload', icon: Calendar, label: t('scheduleUpload') },
    { path: '/notes', icon: FileText, label: t('notes') },
    { path: '/reminders', icon: Bell, label: t('reminders') },
  ];

  return (
    <nav className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full px-4">
        <div className="flex space-x-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 ${
                    isActive 
                      ? 'bg-dusty-blue text-white shadow-lg hover:bg-dusty-blue/90' 
                      : 'hover:bg-warm-cream text-dusty-blue hover:text-dusty-blue'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-dusty-blue'}`} />
                  <span className="hidden sm:inline font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;