import React, { useState } from 'react';
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
  const [newReminder, setNewReminder] = useState({
    classCode: '',
    className: '',
    date: formatDateForDisplay(getTodayInRiyadh()),
    items: ''
  });

  const handleAddReminder = () => {
    if (!newReminder.classCode || !newReminder.items) return;

    const reminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      ...newReminder
    };

    setReminders(prev => [...prev, reminder]);
    setNewReminder({
      classCode: '',
      className: '',
      date: formatDateForDisplay(getTodayInRiyadh()),
      items: ''
    });
  };

  const handleRemoveReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          {t('reminders')}
        </h1>
        <p className="text-muted-foreground">
          Add reminders for items to bring to your classes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Reminder</CardTitle>
          <CardDescription>
            Create a reminder for items you need to bring to class
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classCode">Class Code</Label>
              <Input
                id="classCode"
                placeholder="e.g., CS101"
                value={newReminder.classCode}
                onChange={(e) => setNewReminder(prev => ({ ...prev, classCode: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="className">Class Name (Optional)</Label>
              <Input
                id="className"
                placeholder="e.g., Introduction to Computer Science"
                value={newReminder.className}
                onChange={(e) => setNewReminder(prev => ({ ...prev, className: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newReminder.date}
              onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="items">Items to Bring</Label>
            <Textarea
              id="items"
              placeholder="e.g., Calculator, Textbook Chapter 5, Assignment printout..."
              value={newReminder.items}
              onChange={(e) => setNewReminder(prev => ({ ...prev, items: e.target.value }))}
            />
          </div>
          
          <Button onClick={handleAddReminder} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </CardContent>
      </Card>

      {reminders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Reminders</h2>
          {reminders.map((reminder) => (
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
          ))}
        </div>
      )}

      {reminders.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No reminders yet. Add one above!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reminders;