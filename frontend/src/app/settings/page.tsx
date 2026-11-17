"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, setAuthUser, removeAuthToken, removeAuthUser } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Save, Eye, EyeOff } from "lucide-react";
import { authApi, userApi } from '@/lib/api/auth';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    college: "",
    gradYear: "",
    targetRole: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const loadUser = async () => {
      if (!getAuthToken()) {
        router.push('/login');
        return;
      }

      try {
        // Always load fresh data from the backend
        const userData = await authApi.me();
        setAuthUser(userData);

        if (!userData.isProfileComplete) {
          router.push('/complete-profile');
          return;
        }

        setUser(userData);
        setProfileData({
          name: userData.name || "",
          email: userData.email || "",
          bio: userData.bio || "",
          college: userData.college || "",
          gradYear: userData.gradYear ? String(userData.gradYear) : "",
          targetRole: userData.targetRole || "",
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        removeAuthToken();
        removeAuthUser();
        router.push('/login');
      }
    };

    loadUser();
  }, [router]);

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const updatedUser = await userApi.updateProfile({
        name: profileData.name,
        bio: profileData.bio,
        college: profileData.college,
        gradYear: profileData.gradYear ? Number(profileData.gradYear) : null,
        targetRole: profileData.targetRole,
      });

      setUser(updatedUser);
      setAuthUser(updatedUser);
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      await userApi.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password updated successfully!");
    } catch (error: any) {
      console.error('Error updating password:', error);
      alert(error?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    removeAuthUser();
    router.push('/login');
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Settings</h1>
          <p className="text-gray-600 text-lg">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-6 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl font-bold">
                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user?.name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <Badge variant="outline" className="mt-2">
                    Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    title="Email cannot be changed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college">College/University</Label>
                  <Input 
                    id="college"
                    value={profileData.college}
                    onChange={(e) => setProfileData({...profileData, college: e.target.value})}
                    placeholder="Enter your college"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradYear">Graduation Year</Label>
                  <Input 
                    id="gradYear"
                    type="number"
                    value={profileData.gradYear}
                    onChange={(e) => setProfileData({...profileData, gradYear: e.target.value})}
                    placeholder="Enter graduation year"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role</Label>
                  <Input 
                    id="targetRole"
                    value={profileData.targetRole}
                    onChange={(e) => setProfileData({...profileData, targetRole: e.target.value})}
                    placeholder="Enter your target role"
                  />
                </div>

              </div>

              <div className="space-y-2 mt-6">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleProfileUpdate} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Enter new password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button onClick={handlePasswordChange} disabled={saving}>
                  <Shield className="w-4 h-4 mr-2" />
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Logout Button */}
        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
            <User className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
