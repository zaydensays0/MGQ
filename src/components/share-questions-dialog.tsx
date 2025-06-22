'use client';

import { useState } from 'react';
import { useGroups } from '@/contexts/groups-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Send, Users } from 'lucide-react';

interface ShareQuestionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedQuestionCount: number;
}

export const ShareQuestionsDialog: React.FC<ShareQuestionsDialogProps> = ({ isOpen, onOpenChange, selectedQuestionCount }) => {
  const { groups, addGroup } = useGroups();
  const { toast } = useToast();
  
  // State for sharing with a single user
  const [targetUsername, setTargetUsername] = useState('');

  // State for sharing with a group
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // State for creating a new group
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupUsernames, setNewGroupUsernames] = useState('');

  const handleSend = (target: string, type: 'user' | 'group') => {
    if (!target) {
      toast({ title: 'No Target Specified', description: `Please enter a ${type} to share with.`, variant: 'destructive' });
      return;
    }
    // In a real app, this would trigger an API call. Here, we just log and show a toast.
    console.log(`Sharing ${selectedQuestionCount} questions with ${type} "${target}"`);
    toast({
      title: 'Shared Successfully!',
      description: `${selectedQuestionCount} question(s) have been sent to ${target}. (This is a prototype feature)`,
    });
    onOpenChange(false); // Close dialog on successful send
    // Reset fields
    setTargetUsername('');
    setSelectedGroupId('');
  };

  const handleCreateAndSendGroup = () => {
    if (!newGroupName.trim() || !newGroupUsernames.trim()) {
      toast({ title: 'Incomplete Group Info', description: 'Please provide a group name and at least one username.', variant: 'destructive' });
      return;
    }
    const usernames = newGroupUsernames.split(',').map(u => u.trim()).filter(Boolean);
    if (usernames.length === 0) {
      toast({ title: 'No Usernames', description: 'Please add usernames separated by commas.', variant: 'destructive' });
      return;
    }
    
    const newGroup = addGroup({ name: newGroupName, usernames });
    toast({ title: 'Group Created!', description: `Group "${newGroupName}" has been created.` });
    
    handleSend(newGroup.name, 'group');

    // Reset create group form
    setNewGroupName('');
    setNewGroupUsernames('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Share Questions</DialogTitle>
          <DialogDescription>
            Share {selectedQuestionCount} selected question(s) with other users or groups.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user">With a User</TabsTrigger>
            <TabsTrigger value="group">With a Group</TabsTrigger>
          </TabsList>

          <TabsContent value="user" className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Recipient's Username</Label>
                <Input 
                  id="username" 
                  placeholder="e.g., study_with_anu" 
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={() => handleSend(targetUsername, 'user')} disabled={!targetUsername.trim()}>
                <Send className="mr-2 h-4 w-4" /> Send to User
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="group" className="pt-4 space-y-6">
            {/* Share with existing group */}
            <div className="space-y-4 p-4 border rounded-md">
                <h4 className="font-semibold text-md">Share with an Existing Group</h4>
                <div className="space-y-2">
                    <Label htmlFor="group-select">Select Group</Label>
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger id="group-select">
                            <SelectValue placeholder="Select a group..." />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name} ({group.usernames.length})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <Button className="w-full" onClick={() => {
                     const group = groups.find(g => g.id === selectedGroupId);
                     if (group) handleSend(group.name, 'group');
                 }} disabled={!selectedGroupId}>
                    <Send className="mr-2 h-4 w-4" /> Send to Group
                </Button>
            </div>

            {/* Create new group */}
            <div className="space-y-4 p-4 border rounded-md">
                 <h4 className="font-semibold text-md">Create a New Group & Share</h4>
                <div className="space-y-2">
                    <Label htmlFor="new-group-name">New Group Name</Label>
                    <Input 
                        id="new-group-name" 
                        placeholder="e.g., My Study Circle" 
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-group-users">Usernames (comma-separated)</Label>
                    <Textarea 
                        id="new-group-users" 
                        placeholder="user1, user2, realmehdi"
                        value={newGroupUsernames}
                        onChange={(e) => setNewGroupUsernames(e.target.value)}
                        rows={2}
                    />
                </div>
                 <Button className="w-full" variant="secondary" onClick={handleCreateAndSendGroup} disabled={!newGroupName.trim() || !newGroupUsernames.trim()}>
                    <Users className="mr-2 h-4 w-4" /> Create & Send
                </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-start mt-4">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
