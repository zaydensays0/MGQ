'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function DonationPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 flex justify-center items-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <Heart className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="text-3xl font-headline mt-4">Support Our Mission</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-2">
            Scan the QR code to make a donation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-white rounded-lg">
            <Image
              src="/donation-qr-code.png"
              alt="Donation QR Code"
              width={300}
              height={300}
              className="rounded-md"
            />
          </div>
          <div className="max-w-prose space-y-4 text-left md:text-center text-muted-foreground">
            <p>
              Your generous contribution helps us continue creating high-quality educational resources and experiences for students everywhere. Whether it’s maintaining our platform, developing new features, or reaching underserved communities, every donation makes a difference.
            </p>
            <p>
              We believe that learning should be accessible to all—and with your support, we can make that a reality.
            </p>
            <p className="font-semibold text-foreground">
              🙏 Thank you for believing in our vision.
            </p>
            <p className="font-bold text-lg text-primary">
              Together, we grow.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
