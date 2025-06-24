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
      className="flex flex-col items-center gap-4 p-2"
      dangerouslySetInnerHTML={{
        __html: `
              <script type="text/javascript">
                atOptions = {
                  'key' : '85a4fee3aa8d13d38d9a1cf01a95849f',
                  'format' : 'iframe',
                  'height' : 250,
                  'width' : 300,
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="//www.highperformanceformat.com/85a4fee3aa8d13d38d9a1cf01a95849f/invoke.js"></script>
              <script type="text/javascript">
                atOptions = {
                  'key' : 'ce5cc2223ef1c9b430784445e58c2273',
                  'format' : 'iframe',
                  'height' : 300,
                  'width' : 160,
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="//www.highperformanceformat.com/ce5cc2223ef1c9b430784445e58c2273/invoke.js"></script>
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
              <script async="async" data-cfasync="false" src="//pl26974340.profitableratecpm.com/8a30ee50cf98e47be92f1f73320b34df/invoke.js"></script>
              <div id="container-8a30ee50cf98e47be92f1f73320b34df"></div>
            `,
      }}
    />
  );
}
