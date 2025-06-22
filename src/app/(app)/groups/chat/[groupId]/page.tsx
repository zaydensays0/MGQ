
'use client';

import React, { useState, useEffect, useRef, FormEvent, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGroups } from '@/contexts/groups-context';
import { useUser } from '@/contexts/user-context';
import type { UserGroup, ChatMessage } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Send, Users, MoreVertical, Trash2, UserPlus, AlertTriangle, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';


const ChatMessageBubble: React.FC<{ message: ChatMessage; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
    return (
        <div className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            {!isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={message.senderAvatarUrl} />
                    <AvatarFallback>{message.senderFullName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            )}
            <div className={`flex flex-col space-y-1 text-sm max-w-xs mx-2 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2 rounded-lg inline-block ${isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                    {!isCurrentUser && <p className="text-xs font-bold mb-1">{message.senderFullName}</p>}
                    <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(message.timestamp), 'p')}</span>
            </div>
        </div>
    );
};

function ChatView() {
    const router = useRouter();
    const params = useParams();
    const groupId = params.groupId as string;

    const { getGroupById, addMessageToGroup, removeGroup } = useGroups();
    const { user } = useUser();
    const { toast } = useToast();

    const [group, setGroup] = useState<UserGroup | undefined | null>(undefined);
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        setGroup(getGroupById(groupId));
    }, [groupId, getGroupById]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [group?.messages]);

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !user || !group) return;

        addMessageToGroup(group.id, {
            text: messageText,
            senderUsername: user.username,
            senderFullName: user.fullName,
            senderAvatarUrl: user.avatarUrl,
        });

        setMessageText('');
    };

    const handleDeleteGroup = () => {
        if (group) {
            removeGroup(group.id);
            toast({ title: 'Group Deleted', description: `The group "${group.name}" has been deleted.` });
            router.push('/groups');
        }
    };

    const handleCopyInviteLink = () => {
        if (group) {
            const inviteLink = `${window.location.origin}/groups/join/${group.id}`; // Simulated link
            navigator.clipboard.writeText(inviteLink);
            toast({ title: 'Copied to Clipboard', description: 'Invite link has been copied.' });
        }
    };

    if (group === undefined) {
        return <PageSkeleton />;
    }
    
    if (group === null) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Group Not Found</h2>
                <p className="text-muted-foreground">This chat group does not exist or you may not have access.</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/groups"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups</Link>
                </Button>
            </div>
        );
    }

    const isUserAdmin = user?.username === group.adminUsername;

    return (
        <>
            <div className="flex flex-col h-full">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href="/groups"><ArrowLeft className="h-5 w-5" /></Link>
                        </Button>
                        <div>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription>{group.members.length} members</CardDescription>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setIsInviteDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Invite Members</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsMembersDialogOpen(true)}><Users className="mr-2 h-4 w-4" /> View Members</DropdownMenuItem>
                            {isUserAdmin && <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Group</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {group.messages.map((message) => (
                        <ChatMessageBubble key={message.id} message={message} isCurrentUser={message.senderUsername === user?.username} />
                    ))}
                    <div ref={messagesEndRef} />
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="w-full flex items-center space-x-2">
                        <Input
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type a message..."
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" disabled={!messageText.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </CardFooter>
            </div>

            {/* View Members Dialog */}
            <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Members of "{group.name}"</DialogTitle>
                        <DialogDescription>
                            There are {group.members.length} members in this group.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 max-h-60 overflow-y-auto">
                        <ul className="space-y-3">
                            {group.members.map(member => (
                                <li key={member.username} className="flex items-center space-x-3">
                                    <Avatar>
                                        <AvatarImage src={member.avatarUrl} />
                                        <AvatarFallback>{member.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span>{member.fullName} {member.username === group.adminUsername && <span className="text-xs text-primary font-semibold">(Admin)</span>}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invite Dialog */}
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Members</DialogTitle>
                        <DialogDescription>
                            Share this link with others to invite them to the group. (This is a prototype feature).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 pt-2">
                        <Input value={`${typeof window !== 'undefined' ? window.location.origin : ''}/groups/join/${group.id}`} readOnly />
                        <Button type="button" size="sm" className="px-3" onClick={handleCopyInviteLink}>
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the "{group.name}" group and all of its messages.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, delete group
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

const PageSkeleton = () => (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
            <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex-1 p-4 space-y-4">
            <div className="flex items-end gap-2 justify-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-16 w-48 rounded-lg" />
            </div>
            <div className="flex items-end gap-2 justify-end">
                <Skeleton className="h-12 w-32 rounded-lg" />
            </div>
        </div>
        <div className="p-4 border-t flex items-center space-x-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10 rounded-md" />
        </div>
    </div>
);


export default function ChatPage() {
    return (
        <div className="container mx-auto p-0 md:p-4 h-[calc(100vh-4rem)]">
            <Card className="h-full w-full flex flex-col shadow-lg">
                <Suspense fallback={<PageSkeleton />}>
                    <ChatView />
                </Suspense>
            </Card>
        </div>
    );
}
