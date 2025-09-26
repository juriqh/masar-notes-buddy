import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Home, Upload, FileText, Bell, Calendar, Sparkles } from 'lucide-react';
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
    <nav className="border-b border-white/20 bg-glass backdrop-blur-xl shadow-lg">
      <div className="w-full px-4">
        <div className="flex space-x-2 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`flex items-center gap-3 rounded-xl px-6 py-3 transition-all duration-300 font-semibold relative overflow-hidden group ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 animate-glow' 
                      : 'hover:bg-white/20 text-white hover:text-white hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  {/* Shimmer effect for active items */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  )}
                  
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white animate-bounce-gentle' : 'text-white'} transition-all duration-300`} />
                  <span className="hidden sm:inline relative z-10">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full animate-pulse"></div>
                  )}
                </Button>
              </Link>
            );
          })}
          
          {/* Decorative element */}
          <div className="flex-1 flex justify-end items-center">
            <div className="hidden lg:flex items-center gap-2 text-white/60 text-sm">
              <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="font-medium">Academic Excellence</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;