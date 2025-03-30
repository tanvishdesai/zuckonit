'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/app/components/ThemeProvider';
import { User, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, updateName, updateEmail, updatePassword } = useAuth();
  const { applyTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('account');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  
  const [accountSettings, setAccountSettings] = useState({
    name: '',
    email: '',
    bio: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isUpdating, setIsUpdating] = useState(false);
  
  // Theme settings
  const [primaryColor, setPrimaryColor] = useState('violet');
  const [fontSize, setFontSize] = useState(16);
  
  // Load settings
  useEffect(() => {
    if (user) {
      setAccountSettings({
        name: user.name || '',
        email: user.email || '',
        bio: ''
      });
    }
    
    // Load saved theme preferences from localStorage
    const savedColor = localStorage.getItem('primaryColor');
    const savedFontSize = localStorage.getItem('fontSize');
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedColor) setPrimaryColor(savedColor);
    if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));
    if (savedDarkMode) setIsDarkMode(savedDarkMode === 'true');
  }, [user]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Save dark mode preference
    localStorage.setItem('darkMode', newMode.toString());
    
    // Apply theme using the context
    applyTheme();
  };

  const saveProfileSettings = async () => {
    try {
      setIsUpdating(true);
      
      // Only update name if it changed
      if (user && user.name !== accountSettings.name) {
        await updateName(accountSettings.name);
      }
      
      toast.success('Profile settings saved successfully!');
    } catch (error) {
      console.error('Error saving profile settings:', error);
      toast.error('Failed to save profile settings');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const saveEmailSettings = async () => {
    try {
      setIsUpdating(true);
      
      if (!passwordForm.currentPassword) {
        toast.error('Please enter your current password to update email');
        return;
      }
      
      await updateEmail(accountSettings.email, passwordForm.currentPassword);
      toast.success('Email updated successfully!');
      
      // Clear password fields
      setPasswordForm(prev => ({...prev, currentPassword: ''}));
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const updatePasswordHandler = async () => {
    try {
      setIsUpdating(true);
      
      // Validate passwords
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      if (passwordForm.newPassword.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }
      
      await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      toast.success('Password updated successfully!');
      
      // Clear password fields
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const saveAppearanceSettings = () => {
    try {
      // Save to localStorage
      localStorage.setItem('primaryColor', primaryColor);
      localStorage.setItem('fontSize', fontSize.toString());
      
      // Apply theme using the context
      applyTheme();
      
      toast.success('Appearance settings saved successfully!');
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      toast.error('Failed to save appearance settings');
    }
  };

  if (!user) {
    return (
      <div className="container max-w-6xl py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please log in to access settings</h1>
          <p className="mt-2 text-muted-foreground">You need to be logged in to view and edit your settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 h-auto">
          <TabsTrigger value="account" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Moon className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                    <AvatarFallback className="text-lg">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    Change Avatar
                  </Button>
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium">Display Name</label>
                    <Input 
                      id="name" 
                      placeholder="Your name"
                      value={accountSettings.name}
                      onChange={(e) => setAccountSettings({...accountSettings, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                    <textarea 
                      id="bio"
                      className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Tell us about yourself"
                      value={accountSettings.bio}
                      onChange={(e) => setAccountSettings({...accountSettings, bio: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button onClick={saveProfileSettings} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Address</CardTitle>
              <CardDescription>
                Update your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="Your email address" 
                  value={accountSettings.email}
                  onChange={(e) => setAccountSettings({...accountSettings, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="current-password-email" className="text-sm font-medium">Current Password</label>
                <Input 
                  id="current-password-email" 
                  type="password"
                  placeholder="Enter your current password" 
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">Your password is required to update your email address</p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button onClick={saveEmailSettings} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Email'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="current-password" className="text-sm font-medium">Current Password</label>
                <Input 
                  id="current-password" 
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="new-password" className="text-sm font-medium">New Password</label>
                <Input 
                  id="new-password" 
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</label>
                <Input 
                  id="confirm-password" 
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button onClick={updatePasswordHandler} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Password'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Dark Mode</h3>
                    <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                  </div>
                  <Button variant="outline" size="icon" onClick={toggleDarkMode} aria-label="Toggle theme">
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Color Theme</h3>
                <div className="grid grid-cols-5 gap-2">
                  <button
                    className={`h-10 w-10 rounded-full ${primaryColor === 'violet' ? 'ring-2 ring-offset-2 ring-offset-background ring-violet-600' : ''}`}
                    aria-label="Violet theme"
                    onClick={() => setPrimaryColor('violet')}
                    style={{ background: 'oklch(0.6 0.243 290)' }}
                  />
                  <button
                    className={`h-10 w-10 rounded-full ${primaryColor === 'blue' ? 'ring-2 ring-offset-2 ring-offset-background ring-blue-600' : ''}`}
                    aria-label="Blue theme"
                    onClick={() => setPrimaryColor('blue')}
                    style={{ background: 'oklch(0.6 0.2 240)' }}
                  />
                  <button
                    className={`h-10 w-10 rounded-full ${primaryColor === 'green' ? 'ring-2 ring-offset-2 ring-offset-background ring-green-600' : ''}`}
                    aria-label="Green theme"
                    onClick={() => setPrimaryColor('green')}
                    style={{ background: 'oklch(0.6 0.2 140)' }}
                  />
                  <button
                    className={`h-10 w-10 rounded-full ${primaryColor === 'red' ? 'ring-2 ring-offset-2 ring-offset-background ring-red-600' : ''}`}
                    aria-label="Red theme"
                    onClick={() => setPrimaryColor('red')}
                    style={{ background: 'oklch(0.6 0.2 30)' }}
                  />
                  <button
                    className={`h-10 w-10 rounded-full ${primaryColor === 'yellow' ? 'ring-2 ring-offset-2 ring-offset-background ring-yellow-600' : ''}`}
                    aria-label="Yellow theme"
                    onClick={() => setPrimaryColor('yellow')}
                    style={{ background: 'oklch(0.7 0.2 85)' }}
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Font Size</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm">A</span>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-lg">A</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Current size: {fontSize}px</p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button variant="outline" onClick={() => {
                setPrimaryColor('violet');
                setFontSize(16);
              }}>
                Reset to Default
              </Button>
              <Button onClick={saveAppearanceSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 