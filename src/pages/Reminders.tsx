import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTodayInRiyadh, formatDateForDisplay } from '@/utils/datetime';

interface Reminder {
  id: string;
  classCode: string;
  className: string;
  date: string;
  items: string;
}

const Reminders: React.FC = () => {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [hasSchedule, setHasSchedule] = useState(() => {
    const saved = localStorage.getItem('schedule_uploaded');
    return saved === 'true';
  });
  const [newReminder, setNewReminder] = useState({
    classCode: '',
    className: '',
    date: formatDateForDisplay(getTodayInRiyadh()),
    items: ''
  });

  const handleAddReminder = () => {
    if (newReminder.classCode && newReminder.items) {
      const reminder: Reminder = {
        id: Date.now().toString(),
        classCode: newReminder.classCode,
        className: newReminder.className,
        date: newReminder.date,
        items: newReminder.items
      };
      
      setReminders(prev => [...prev, reminder]);
      setNewReminder({
        classCode: '',
        className: '',
        date: formatDateForDisplay(getTodayInRiyadh()),
        items: ''
      });
    }
  };

  const handleRemoveReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('schedule_uploaded');
      setHasSchedule(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          {t('reminders')}
        </h1>
        <p className="text-muted-foreground">
          {t('remindersDescription')}
        </p>
      </div>

      {hasSchedule ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Add New Reminder</CardTitle>
              <CardDescription>
                Set reminders for things to bring to specific classes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classCode">Class Code</Label>
                  <Input
                    id="classCode"
                    value={newReminder.classCode}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, classCode: e.target.value }))}
                    placeholder="e.g., CS101"
                  />
                </div>
                <div>
                  <Label htmlFor="className">Class Name (Optional)</Label>
                  <Input
                    id="className"
                    value={newReminder.className}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, className: e.target.value }))}
                    placeholder="e.g., Introduction to Programming"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newReminder.date}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="items">Items to Bring</Label>
                <Textarea
                  id="items"
                  value={newReminder.items}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, items: e.target.value }))}
                  placeholder="List the items you need to bring..."
                  rows={3}
                />
              </div>
              
              <Button onClick={handleAddReminder} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Reminder
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Reminders</h2>
            {reminders.length > 0 ? (
              reminders.map((reminder) => (
                <Card key={reminder.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{reminder.classCode}</span>
                          {reminder.className && (
                            <span className="text-muted-foreground">- {reminder.className}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(reminder.date).toLocaleDateString()}
                        </p>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{reminder.items}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReminder(reminder.id)}
                        className="ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {t('noReminders')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('noRemindersDescription')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {t('noReminders')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('noRemindersDescription')}
            </p>
            <a 
              href="/schedule-upload" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t('uploadSchedule')}
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reminders;