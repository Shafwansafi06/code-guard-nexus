import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Shield, CreditCard } from 'lucide-react';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> Security</TabsTrigger>
            <TabsTrigger value="billing" className="gap-2"><CreditCard className="w-4 h-4" /> Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="p-6 rounded-xl glass space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white">JS</div>
              <Button variant="outline">Change Photo</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input defaultValue="Prof. John Smith" /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue="john@university.edu" /></div>
              <div className="space-y-2"><Label>Department</Label><Input defaultValue="Computer Science" /></div>
              <div className="space-y-2"><Label>Institution</Label><Input defaultValue="Example University" /></div>
            </div>
            <Button variant="hero">Save Changes</Button>
          </TabsContent>

          <TabsContent value="notifications" className="p-6 rounded-xl glass space-y-4">
            {['Scan complete', 'High-risk pairs found', 'Weekly summary'].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <span>{item}</span>
                <Switch defaultChecked={i < 2} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="security" className="p-6 rounded-xl glass space-y-4">
            <div className="space-y-2"><Label>Current Password</Label><Input type="password" /></div>
            <div className="space-y-2"><Label>New Password</Label><Input type="password" /></div>
            <Button variant="hero">Update Password</Button>
          </TabsContent>

          <TabsContent value="billing" className="p-6 rounded-xl glass">
            <div className="text-center py-8">
              <p className="text-lg font-medium mb-2">Pro Plan - $29/month</p>
              <p className="text-muted-foreground mb-4">Next billing: Jan 15, 2026</p>
              <Button variant="outline">Manage Subscription</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
