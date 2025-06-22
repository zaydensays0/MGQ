
'use client';

import { useState } from 'react';
import { useSharedPosts } from '@/contexts/shared-posts-context';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';

interface ShareQuestionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedQuestionIds: string[];
  onShare: () => void; // Callback to clear selection after sharing
}

export const ShareQuestionsDialog: React.FC<ShareQuestionsDialogProps> = ({ isOpen, onOpenChange, selectedQuestionIds, onShare }) => {
  const { addPost } = useSharedPosts();
  const { user } = useUser();
  const { savedQuestions } = useSavedQuestions();
  const { toast } = useToast();
  
  const [message, setMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePostToCommunity = () => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to post.', variant: 'destructive' });
      return;
    }
    if (selectedQuestionIds.length === 0) {
      toast({ title: 'No Questions Selected', description: 'Please select at least one question to share.', variant: 'destructive' });
      return;
    }

    setIsPosting(true);
    
    const questionsToShare = savedQuestions.filter(q => selectedQuestionIds.includes(q.id));

    addPost({
      author: { username: user.username, avatarUrl: user.avatarUrl },
      questions: questionsToShare,
      message: message.trim() || null,
    });

    // Simulate network latency for better UX
    setTimeout(() => {
        toast({
          title: 'Posted to Community!',
          description: `${questionsToShare.length} question(s) have been shared.`,
        });
        setIsPosting(false);
        onOpenChange(false); // Close the dialog
        setMessage(''); // Reset message input
        onShare(); // Clear selection in parent component
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Post to Community Hub</DialogTitle>
          <DialogDescription>
            Share {selectedQuestionIds.length} selected question(s) with the entire community. Add an optional message to provide context.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2">
          <Label htmlFor="share-message">Optional Message</Label>
          <Textarea 
            id="share-message"
            placeholder="e.g., 'Found these helpful for the upcoming test!'"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
        
        <DialogFooter>
           <DialogClose asChild>
            <Button type="button" variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handlePostToCommunity} disabled={isPosting}>
            {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isPosting ? 'Posting...' : 'Post to Hub'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
