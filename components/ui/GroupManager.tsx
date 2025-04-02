'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Group, getUserGroups, createGroup, deleteGroup, addUserToGroup, removeUserFromGroup, getGroupMembers, searchUsers, getAllUsers } from '@/lib/appwrite';
import { Plus, Trash2, Users, X, Search, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define a User interface
interface User {
    userId: string;
    name: string;
    email?: string;
    profilePictureId?: string | null;
    bio?: string | null;
    created_at?: string;
    postCount?: number;
}

// Define a GroupMember interface
interface GroupMember {
    $id: string;
    group_id: string;
    user_id: string;
    user_name: string;
    added_at: string;
}

export function GroupManager() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('search');

    useEffect(() => {
        loadGroups();
        loadAllUsers();
    }, []);

    const loadGroups = async () => {
        try {
            const userGroups = await getUserGroups();
            setGroups(userGroups);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    const loadAllUsers = async () => {
        try {
            const users = await getAllUsers();
            setAllUsers(users);
        } catch (error) {
            console.error('Error loading all users:', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;

        try {
            setIsLoading(true);
            await createGroup(newGroupName, newGroupDescription);
            setNewGroupName('');
            setNewGroupDescription('');
            await loadGroups();
        } catch (error) {
            console.error('Error creating group:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Are you sure you want to delete this group?')) return;

        try {
            setIsLoading(true);
            await deleteGroup(groupId);
            await loadGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchUsers = async (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const results = await searchUsers(term);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleAddUserToGroup = async (groupId: string, userId: string) => {
        try {
            setIsLoading(true);
            await addUserToGroup(groupId, userId);
            await loadGroupMembers(groupId);
            setSearchResults([]);
            setSearchTerm('');
        } catch (error) {
            console.error('Error adding user to group:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveUserFromGroup = async (groupId: string, userId: string) => {
        try {
            setIsLoading(true);
            await removeUserFromGroup(groupId, userId);
            await loadGroupMembers(groupId);
        } catch (error) {
            console.error('Error removing user from group:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadGroupMembers = async (groupId: string) => {
        try {
            const members = await getGroupMembers(groupId);
            setGroupMembers(members);
        } catch (error) {
            console.error('Error loading group members:', error);
        }
    };

    // Filter out users who are already members of the group
    const filterNonMembers = (users: User[]) => {
        if (!groupMembers || groupMembers.length === 0) return users;
        
        const memberIds = groupMembers.map(member => member.user_id);
        return users.filter(user => !memberIds.includes(user.userId));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Group</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Input
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            disabled={isLoading}
                        />
                        <Textarea
                            placeholder="Group Description (optional)"
                            value={newGroupDescription}
                            onChange={(e) => setNewGroupDescription(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleCreateGroup}
                            disabled={isLoading || !newGroupName.trim()}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Group
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                    <Card key={group.$id}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{group.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteGroup(group.$id)}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                {group.description || 'No description'}
                            </p>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            loadGroupMembers(group.$id);
                                            setActiveTab('search');
                                        }}
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        Manage Members
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Manage Members: {group.name}</DialogTitle>
                                    </DialogHeader>
                                    <Tabs defaultValue="search" value={activeTab} onValueChange={setActiveTab}>
                                        <TabsList className="grid grid-cols-2 mb-4">
                                            <TabsTrigger value="search">
                                                <Search className="h-4 w-4 mr-2" />
                                                Search Users
                                            </TabsTrigger>
                                            <TabsTrigger value="all">
                                                <UserIcon className="h-4 w-4 mr-2" />
                                                All Users
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="search" className="space-y-4">
                                            <Input
                                                placeholder="Search users by name..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    handleSearchUsers(e.target.value);
                                                }}
                                            />
                                            <ScrollArea className="h-[200px]">
                                                <div className="space-y-2">
                                                    {filterNonMembers(searchResults).map((user) => (
                                                        <div
                                                            key={user.userId}
                                                            className="flex items-center justify-between p-2 border rounded"
                                                        >
                                                            <span>{user.name}</span>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleAddUserToGroup(group.$id, user.userId)}
                                                                disabled={isLoading}
                                                            >
                                                                Add
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {searchTerm && searchResults.length === 0 && (
                                                        <p className="text-center text-muted-foreground py-4">
                                                            No users found
                                                        </p>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>
                                        <TabsContent value="all" className="space-y-4">
                                            <ScrollArea className="h-[250px]">
                                                <div className="space-y-2">
                                                    {filterNonMembers(allUsers).map((user) => (
                                                        <div
                                                            key={user.userId}
                                                            className="flex items-center justify-between p-2 border rounded"
                                                        >
                                                            <span>{user.name}</span>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleAddUserToGroup(group.$id, user.userId)}
                                                                disabled={isLoading}
                                                            >
                                                                Add
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {allUsers.length === 0 && (
                                                        <p className="text-center text-muted-foreground py-4">
                                                            No users available
                                                        </p>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>
                                    </Tabs>
                                    <div className="border-t pt-4 mt-2">
                                        <h4 className="font-medium mb-2">Current Members</h4>
                                        <ScrollArea className="h-[200px]">
                                            <div className="space-y-2">
                                                {groupMembers.map((member) => (
                                                    <div
                                                        key={member.user_id}
                                                        className="flex items-center justify-between p-2 border rounded"
                                                    >
                                                        <span>{member.user_name}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveUserFromGroup(group.$id, member.user_id)}
                                                            disabled={isLoading}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {groupMembers.length === 0 && (
                                                    <p className="text-center text-muted-foreground py-4">
                                                        No members in this group
                                                    </p>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 