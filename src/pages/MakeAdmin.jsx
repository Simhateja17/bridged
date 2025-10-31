import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, UserPlus, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { createAdminUser } from '@/api/functions';

export default function MakeAdmin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [currentUser, setCurrentUser] = useState(null);
  
  // Create new admin form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Check if current user is admin
  React.useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        if (user.role !== 'admin') {
          setMessage({ text: '❌ Access Denied: Only admins can promote other users to admin.', type: 'error' });
        }
      } catch (error) {
        setMessage({ text: '❌ You must be logged in as an admin to access this page.', type: 'error' });
      }
    };
    checkAdmin();
  }, []);

  // Fetch all users to show current admins
  const { data: allUsers, refetch } = useQuery({
    queryKey: ['all-users-for-admin'],
    queryFn: () => base44.entities.User.list('-created_date'),
    enabled: currentUser?.role === 'admin'
  });

  const handleCreateNewAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      setMessage({ text: '⚠️ Please enter email and password.', type: 'error' });
      return;
    }

    setCreateLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await createAdminUser({
        email: newAdminEmail,
        full_name: newAdminName || newAdminEmail.split('@')[0],
        password: newAdminPassword
      });

      if (response.data.success) {
        setMessage({ 
          text: `✅ Admin account created! Email: ${newAdminEmail} | Password: ${newAdminPassword}`, 
          type: 'success' 
        });
        setNewAdminEmail('');
        setNewAdminName('');
        setNewAdminPassword('');
        setShowCreateForm(false);
        refetch();
      } else {
        setMessage({ text: `❌ ${response.data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setMessage({ text: `❌ Error: ${error.message}`, type: 'error' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!email) {
      setMessage({ text: '⚠️ Please enter an email address.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Find user by email
      const users = await base44.entities.User.filter({ email: email.toLowerCase().trim() });
      
      if (users.length === 0) {
        setMessage({ text: `❌ No user found with email: ${email}`, type: 'error' });
        setLoading(false);
        return;
      }

      const user = users[0];

      if (user.role === 'admin') {
        setMessage({ text: `ℹ️ ${user.full_name || user.email} is already an admin.`, type: 'info' });
        setLoading(false);
        return;
      }

      // Update user role to admin
      await base44.entities.User.update(user.id, { role: 'admin' });
      
      setMessage({ 
        text: `✅ Success! ${user.full_name || user.email} is now an admin.`, 
        type: 'success' 
      });
      setEmail('');
      refetch(); // Refresh the user list
      
    } catch (error) {
      console.error('Error making admin:', error);
      setMessage({ text: `❌ Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId, userName) => {
    if (!window.confirm(`Remove admin access from ${userName}?`)) return;

    try {
      await base44.entities.User.update(userId, { role: 'user' });
      setMessage({ text: `✅ Admin access removed from ${userName}`, type: 'success' });
      refetch();
    } catch (error) {
      setMessage({ text: `❌ Error: ${error.message}`, type: 'error' });
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F5F2]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1C2E45]" />
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F5F2]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">Only administrators can access this page.</p>
            <Button onClick={() => window.history.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminUsers = allUsers?.filter(u => u.role === 'admin') || [];
  const nonAdminUsers = allUsers?.filter(u => u.role !== 'admin') || [];

  return (
    <div className="min-h-screen bg-[#F8F5F2] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-[#1C2E45]" />
            <h1 className="text-4xl font-bold text-[#1C2E45]">Admin Management</h1>
          </div>
          <p className="text-gray-600">Promote users to admin status or create new admin accounts</p>
        </div>

        {/* Create New Admin Account */}
        <Card className="border-2 border-green-500/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Admin Account
                </CardTitle>
                <CardDescription>Create a brand new admin user from scratch</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'Cancel' : 'Create New Admin'}
              </Button>
            </div>
          </CardHeader>
          {showCreateForm && (
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    disabled={createLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    disabled={createLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <Input
                    type="text"
                    placeholder="Create a strong password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    disabled={createLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">They can change this password after logging in</p>
                </div>
              </div>
              <Button 
                onClick={handleCreateNewAdmin} 
                disabled={createLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Admin Account...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Admin Account
                  </>
                )}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Promote Existing User to Admin */}
        <Card className="border-2 border-[#1C2E45]/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Promote Existing User to Admin
            </CardTitle>
            <CardDescription>Enter the email address of an existing user to make them an admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <Button 
                onClick={handleMakeAdmin} 
                disabled={loading}
                className="bg-[#1C2E45] hover:bg-[#2A3F5F]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Make Admin
                  </>
                )}
              </Button>
            </div>

            {message.text && (
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                message.type === 'success' ? 'bg-green-50 border-green-200' :
                message.type === 'error' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" /> :
                 <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Admins */}
        <Card>
          <CardHeader>
            <CardTitle>Current Administrators ({adminUsers.length})</CardTitle>
            <CardDescription>Users with full admin access to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {adminUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.account_type || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.id !== currentUser.id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveAdmin(user.id, user.full_name || user.email)}
                          >
                            Remove Admin
                          </Button>
                        )}
                        {user.id === currentUser.id && (
                          <Badge>You</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-8">No admins found</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Add Suggestions */}
        {nonAdminUsers.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Quick Add Users</CardTitle>
              <CardDescription>Recent users on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {nonAdminUsers.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{user.full_name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEmail(user.email);
                        handleMakeAdmin();
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Make Admin
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}