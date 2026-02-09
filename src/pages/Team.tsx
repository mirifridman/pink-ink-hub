import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Search, Users, UserCog, Loader2, UserPlus } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useUsers, UserProfile } from '@/hooks/useUsers';
import { EmployeeCard } from '@/components/team/EmployeeCard';
import { EmployeeModal } from '@/components/team/EmployeeModal';
import { UserCard } from '@/components/users/UserCard';
import { UserModal } from '@/components/users/UserModal';
import { CreateUserModal } from '@/components/users/CreateUserModal';

export default function Team() {
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: users, isLoading: loadingUsers } = useUsers();
  
  const [activeTab, setActiveTab] = useState('team');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Team modals
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // User modals
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!searchQuery.trim()) return employees;

    const query = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.full_name.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.position?.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const activeCount = employees?.filter((e) => e.is_active).length || 0;
  const totalEmployees = employees?.length || 0;
  const totalUsers = users?.length || 0;

  const handleAddEmployee = () => {
    setSelectedEmployeeId(null);
    setEmployeeModalOpen(true);
  };

  const handleEditEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setEmployeeModalOpen(true);
  };

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setUserModalOpen(true);
  };

  return (
    <AppLayout
      title="ניהול צוות ומשתמשים"
      subtitle={activeTab === 'team' 
        ? `${totalEmployees} עובדים • ${activeCount} פעילים`
        : `${totalUsers} משתמשים רשומים`
      }
    >
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="flex w-full sm:w-auto sm:max-w-md justify-start gap-1 h-auto p-1">
          <TabsTrigger value="team" className="flex-1 sm:flex-none gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            צוות
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 sm:flex-none gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5">
            <UserCog className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            משתמשים
          </TabsTrigger>
        </TabsList>

        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'team' 
                ? "חיפוש לפי שם, אימייל, תפקיד או מחלקה..."
                : "חיפוש לפי שם או אימייל..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          {activeTab === 'team' && (
            <Button onClick={handleAddEmployee}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף עובד
            </Button>
          )}
          {activeTab === 'users' && (
            <Button onClick={() => setCreateUserModalOpen(true)}>
              <UserPlus className="h-4 w-4 ml-2" />
              הוסף משתמש
            </Button>
          )}
        </div>

        {/* Team Tab Content */}
        <TabsContent value="team" className="mt-0">
          {loadingEmployees ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'לא נמצאו עובדים' : 'אין עובדים עדיין'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'נסה לחפש במונח אחר'
                  : 'הוסף את העובד הראשון לצוות'}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddEmployee}>
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף עובד
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onClick={() => handleEditEmployee(employee.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Users Tab Content */}
        <TabsContent value="users" className="mt-0">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'לא נמצאו משתמשים' : 'אין משתמשים עדיין'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'נסה לחפש במונח אחר'
                  : 'משתמשים יופיעו כאן לאחר הרשמה'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onClick={() => handleViewUser(user.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <EmployeeModal
        open={employeeModalOpen}
        onOpenChange={setEmployeeModalOpen}
        employeeId={selectedEmployeeId}
      />
      
      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        userId={selectedUserId}
      />
      
      <CreateUserModal
        open={createUserModalOpen}
        onOpenChange={setCreateUserModalOpen}
      />
    </AppLayout>
  );
}
