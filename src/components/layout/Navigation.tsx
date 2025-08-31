import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Home, Upload, FileText, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Navigation: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: t('dashboard') },
    { path: '/upload', icon: Upload, label: t('upload') },
    { path: '/notes', icon: FileText, label: t('notes') },
    { path: '/reminders', icon: Bell, label: t('reminders') },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container">
        <div className="flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
                  data-active={isActive}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
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