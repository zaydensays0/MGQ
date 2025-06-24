'use client';

import { useEffect, useRef } from 'react';

export function AdBanner() {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isScriptsLoaded = useRef(false);

  useEffect(() => {
    // This effect runs only on the client, and only once.
    if (isScriptsLoaded.current || !adContainerRef.current) {
      return;
    }
    
    const container = adContainerRef.current;
    
    // --- Ad 1: 300x250 ---
    const script1Config = document.createElement('script');
    script1Config.type = 'text/javascript';
    script1Config.innerHTML = `
      atOptions = {
        'key' : '85a4fee3aa8d13d38d9a1cf01a95849f',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;
    container.appendChild(script1Config);

    const script1Invoke = document.createElement('script');
    script1Invoke.type = 'text/javascript';
    script1Invoke.src = '//www.highperformanceformat.com/85a4fee3aa8d13d38d9a1cf01a95849f/invoke.js';
    container.appendChild(script1Invoke);

    // --- Ad 2: 160x300 ---
    const script2Config = document.createElement('script');
    script2Config.type = 'text/javascript';
    script2Config.innerHTML = `
      atOptions = {
        'key' : 'ce5cc2223ef1c9b430784445e58c2273',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
      };
    `;
    container.appendChild(script2Config);
    
    const script2Invoke = document.createElement('script');
    script2Invoke.type = 'text/javascript';
    script2Invoke.src = '//www.highperformanceformat.com/ce5cc2223ef1c9b430784445e58c2273/invoke.js';
    container.appendChild(script2Invoke);
    
    // --- Ad 3: 320x50 ---
    const script3Config = document.createElement('script');
    script3Config.type = 'text/javascript';
    script3Config.innerHTML = `
      atOptions = {
        'key' : 'c95e7e6770fd1266273791de339c0972',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;
    container.appendChild(script3Config);
    
    const script3Invoke = document.createElement('script');
    script3Invoke.type = 'text/javascript';
    script3Invoke.src = '//www.highperformanceformat.com/c95e7e6770fd1266273791de339c0972/invoke.js';
    container.appendChild(script3Invoke);
    
    // --- Ad 4: Native Banner ---
    const nativeBannerContainer = document.createElement('div');
    nativeBannerContainer.id = 'container-8a30ee50cf98e47be92f1f73320b34df';
    container.appendChild(nativeBannerContainer);
    
    const script4Invoke = document.createElement('script');
    script4Invoke.async = true;
    script4Invoke.setAttribute('data-cfasync', 'false');
    script4Invoke.src = '//pl26974340.profitableratecpm.com/8a30ee50cf98e47be92f1f73320b34df/invoke.js';
    container.appendChild(script4Invoke);

    isScriptsLoaded.current = true;
  }, []);

  return <div ref={adContainerRef} className="flex flex-col items-center gap-4 p-2" />;
}
