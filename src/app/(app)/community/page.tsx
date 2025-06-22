
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGroups, type GroupCreationData } from '@/contexts/groups-context';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, PlusCircle, ChevronRight, MessageSquare } from 'lucide-react';

export default function CommunityPage() {
    const { groups, addGroup } = useGroups();
    const { user } = useUser();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) {
            toast({ title: 'Group name is required.', variant: 'destructive' });
            return;
        }
        if (!user) {
             toast({ title: 'You must be logged in to create a group.', variant: 'destructive' });
            return;
        }

        const groupData: GroupCreationData = {
            name: newGroupName,
            adminUsername: user.username,
            members: [{ username: user.username, avatarUrl: user.avatarUrl }]
        };

        addGroup(groupData);
        toast({ title: 'Group Created!', description: `You can now start chatting in "${newGroupName}".` });
        setNewGroupName('');
        setIsCreateDialogOpen(false);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Users className="w-8 h-8 mr-3 text-primary" />
                    Groups
                </h1>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a New Group</DialogTitle>
                            <DialogDescription>
                                Give your new chat group a name. You can invite others later.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="group-name">Group Name</Label>
                            <Input 
                                id="group-name"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="e.g., Exam Warriors"
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {groups.length > 0 ? (
                <div className="space-y-4">
                    {groups.map(group => (
                        <Card key={group.id} className="shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                     <Avatar className="h-12 w-12">
                                        <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-lg font-semibold font-headline">{group.name}</h2>
                                        <p className="text-sm text-muted-foreground">{group.members.length} member(s)</p>
                                    </div>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/community/chat/${group.id}`}>
                                        Open Chat <ChevronRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">No Groups Yet</h3>
                    <p className="mb-4">Create a group to start collaborating with your study partners!</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Group
                    </Button>
                </div>
            )}
        </div>
    );
}

