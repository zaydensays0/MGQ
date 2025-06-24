
'use client';

import { useState, useEffect } from 'react';

export function AdBanner() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component mounts
    setIsClient(true);
  }, []);

  // Render nothing on the server and during the initial client-side render
  if (!isClient) {
    return null;
  }

  // Render the ad script only on the client
  return (
    <div
      className="flex justify-center p-2"
      dangerouslySetInnerHTML={{
        __html: `
              <script type="text/javascript">
                atOptions = {
                  'key' : 'c95e7e6770fd1266273791de339c0972',
                  'format' : 'iframe',
                  'height' : 50,
                  'width' : 320,
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="//www.highperformanceformat.com/c95e7e6770fd1266273791de339c0972/invoke.js"></script>
            `,
      }}
    />
  );
}
