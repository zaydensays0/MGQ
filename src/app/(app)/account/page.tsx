
'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { User, CheckCircle, XCircle, Wand2, Loader2, UploadCloud, ShieldCheck, KeyRound, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestUsername, type SuggestUsernameInput, type SuggestUsernameOutput } from '@/ai/flows/suggest-username';
import { cn } from '@/lib/utils';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useUser } from '@/contexts/user-context';
import type { User as UserType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// Debounce hook for username checking
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

// Zod schema for security settings form
const securitySchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
}).refine(data => {
    // Require all password fields if one is filled
    if (data.newPassword || data.confirmPassword || data.currentPassword) {
        return !!data.currentPassword && !!data.newPassword && !!data.confirmPassword;
    }
    return true;
}, {
    message: "Please fill all three password fields to change your password.",
    path: ["currentPassword"], // Show error message under the first password field
}).refine(data => {
    // Require new password to be at least 6 chars
    if (data.newPassword) {
        return data.newPassword.length >= 6;
    }
    return true;
}, {
    message: "New password must be at least 6 characters.",
    path: ["newPassword"],
}).refine(data => {
    // Require passwords to match
    return data.newPassword === data.confirmPassword;
}, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});


export default function AccountPage() {
    const { user, updateUser, isInitialized, logout } = useUser();
    const router = useRouter();
    
    // State for Profile Section
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [newUsername, setNewUsername] = useState('');
    const [usernameResult, setUsernameResult] = useState<SuggestUsernameOutput | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // State for Avatar Cropping
    const [imageSrc, setImageSrc] = useState<string>('');
    const [crop, setCrop] = useState<Crop>();
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { toast } = useToast();
    const debouncedUsername = useDebounce(newUsername, 500);

    // Security Form using React Hook Form
    const securityForm = useForm<z.infer<typeof securitySchema>>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            email: user?.email || '',
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Initialize form with user data once context is ready
    useEffect(() => {
        if (isInitialized && user) {
            setFullName(user.fullName);
            securityForm.reset({ email: user.email });
        }
    }, [isInitialized, user, securityForm]);


    // --- Username Availability Logic ---
    const checkUsernameAvailability = useCallback(async (name: string) => {
        if (!name || name.length < 3) {
            setUsernameResult(null);
            return;
        }
        setIsCheckingUsername(true);
        setUsernameResult(null);
        try {
            const input: SuggestUsernameInput = { username: name, fullName: user?.fullName };
            const response = await suggestUsername(input);
            setUsernameResult(response);
        } catch (error) {
            console.error('Error checking username:', error);
            setUsernameResult({ status: 'invalid', message: 'Could not check username.' });
        } finally {
            setIsCheckingUsername(false);
        }
    }, [user?.fullName]);

    useEffect(() => {
        if (debouncedUsername) {
            checkUsernameAvailability(debouncedUsername);
        } else {
            setUsernameResult(null);
        }
    }, [debouncedUsername, checkUsernameAvailability]);


    // --- Avatar Upload & Crop Logic ---
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(makeAspectCrop({ unit: 'px', width: 150 }, 1, width, height), width, height);
        setCrop(initialCrop);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ title: 'Image too large', description: 'Please select an image smaller than 2MB.', variant: 'destructive' });
                return;
            }
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(file);
            setIsCropModalOpen(true);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const handleApplyCrop = () => {
        const image = imgRef.current;
        if (!image || !crop?.width || !crop.height) return;

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
        setNewAvatarUrl(canvas.toDataURL('image/png'));
        setIsCropModalOpen(false);
    };


    // --- Form Submission Logic ---
    const handleUpdateProfile = () => {
        if (!user) return;
        const updates: Partial<UserType> = {};
        if (fullName !== user.fullName) updates.fullName = fullName;
        if (usernameResult?.status === 'available') updates.username = newUsername;
        if (newAvatarUrl) updates.avatarUrl = newAvatarUrl;

        if (Object.keys(updates).length > 0) {
            updateUser(updates);
            toast({ title: 'Profile Updated!', description: 'Your public profile has been updated.' });
            setNewUsername('');
            setUsernameResult(null);
            setNewAvatarUrl(null);
        } else {
            toast({ title: 'No Changes', description: 'No new information was provided to update.' });
        }
    };

    const handleUpdateSecurity = (values: z.infer<typeof securitySchema>) => {
        if (!user) return;

        // Handle Email Change
        if (values.email !== user.email) {
            // In a real app, this would require verification.
            // For prototype, we just update it.
            updateUser({ email: values.email });
            toast({ title: "Email Updated!", description: "Your login email has been changed." });
        }
        
        // Handle Password Change
        if (values.newPassword) {
            // This is a prototype, so we'll check against the mock password
            if (values.currentPassword !== user.password) {
                securityForm.setError("currentPassword", { type: "manual", message: "Your current password is incorrect. Try again." });
                toast({ title: "Incorrect Password", description: "The current password you entered is incorrect.", variant: "destructive" });
                return;
            }
            
            // On success, update the user object in our mock db
            updateUser({ password: values.newPassword });

            toast({ 
                title: "Password Updated!", 
                description: "Your password has been changed successfully. Keep it safe!",
                variant: "default",
            });
            securityForm.reset({ 
                email: values.email, 
                currentPassword: "", 
                newPassword: "", 
                confirmPassword: ""
            });
        }
    };

    const handleLogout = () => {
        logout();
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push('/auth/login');
    };
    
    // --- UI Helpers ---
    const getUsernameResultColor = () => {
        if (!usernameResult) return 'text-muted-foreground';
        switch (usernameResult.status) {
            case 'available': return 'text-green-600 dark:text-green-400';
            case 'taken': return 'text-red-600 dark:text-red-400';
            default: return 'text-yellow-600 dark:text-yellow-400';
        }
    };

    const canUpdateProfile = user && (fullName !== user.fullName || usernameResult?.status === 'available' || !!newAvatarUrl);

    if (!isInitialized || !user) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <div className="mb-8"><Skeleton className="h-10 w-64" /></div>
                <Card className="w-full max-w-4xl mx-auto"><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold flex items-center">
                        <User className="w-8 h-8 mr-3 text-primary" />
                        Account Settings
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your profile, security, and preferences.</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
            </div>


            <Card className="w-full max-w-4xl mx-auto shadow-lg">
                {/* --- PUBLIC PROFILE SECTION --- */}
                <CardHeader>
                    <CardTitle>Public Profile</CardTitle>
                    <CardDescription>This information may be visible to other users.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex flex-col items-center gap-4 p-4 bg-muted/30 rounded-lg">
                            <img src={newAvatarUrl || user.avatarUrl} alt="Avatar" data-ai-hint="profile picture" className="w-24 h-24 rounded-full shadow-md object-cover bg-background" />
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4" /> Upload New Avatar
                            </Button>
                            <input id="avatar-upload" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" hidden />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <Input id="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder={user.username} maxLength={20} className="pr-10" />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    {isCheckingUsername ? <Loader2 className="h-5 w-5 animate-spin" /> : usernameResult && (usernameResult.status === 'available' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />)}
                                </div>
                            </div>
                             {usernameResult && <p className={cn('text-sm font-medium pt-1', getUsernameResultColor())}>{usernameResult.status === 'available' ? '✅' : '❌'} {usernameResult.message}</p>}
                        </div>
                        {usernameResult?.status === 'taken' && usernameResult.suggestions && (
                            <div className="space-y-2 pt-1">
                                <Label className="flex items-center text-sm"><Wand2 className="w-4 h-4 mr-2" /> Suggestions:</Label>
                                <div className="flex flex-wrap gap-2">{usernameResult.suggestions.map(s => <Button key={s} variant="outline" size="sm" onClick={() => setNewUsername(s)}>{s}</Button>)}</div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleUpdateProfile} disabled={isCheckingUsername || !canUpdateProfile}>Update Profile</Button>
                </CardFooter>

                <Separator className="my-0" />

                {/* --- SECURITY SETTINGS SECTION --- */}
                <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(handleUpdateSecurity)}>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Manage your email and password. Remember your password, it cannot be recovered.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <FormField
                                control={securityForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl><Input placeholder="your.email@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="space-y-4 pt-4 border-t">
                                 <h3 className="text-md font-semibold flex items-center"><KeyRound className="w-5 h-5 mr-2" /> Change Password</h3>
                                <FormField control={securityForm.control} name="currentPassword" render={({ field }) => (
                                    <FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={securityForm.control} name="newPassword" render={({ field }) => (
                                    <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={securityForm.control} name="confirmPassword" render={({ field }) => (
                                    <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                             </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button type="submit" disabled={securityForm.formState.isSubmitting}>
                                {securityForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Security Settings
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            {/* --- AVATAR CROP DIALOG --- */}
            <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Adjust Your Avatar</DialogTitle><DialogDescription>Move and resize the selection to crop your image.</DialogDescription></DialogHeader>
                    <div className="mt-4">{imageSrc && <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1} circularCrop><img ref={imgRef} alt="Crop preview" src={imageSrc} onLoad={onImageLoad} style={{maxHeight: '70vh'}} /></ReactCrop>}</div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsCropModalOpen(false)}>Cancel</Button><Button onClick={handleApplyCrop}>Apply Crop</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    
