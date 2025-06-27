'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface LoginPromptDialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
}

export const LoginPromptDialog: React.FC<LoginPromptDialogProps> = ({ children, open, onOpenChange, onCancel }) => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };
  
  const handleCancel = () => {
      if (onCancel) {
          onCancel();
      }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <LogIn className="mr-2 h-5 w-5" /> Please Sign In
          </AlertDialogTitle>
          <AlertDialogDescription>
            This feature is only available for registered users. Please sign in or create an account to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>Log In / Sign Up</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
