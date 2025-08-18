import React, { useEffect, useRef, useState, useCallback } from 'react';

interface UnityGameProps {
  className?: string;
}

// 声明Unity全局对象
declare global {
  interface Window {
    createUnityInstance?: (
      container: HTMLCanvasElement,
      config: {
        dataUrl: string;
        frameworkUrl: string;
        codeUrl: string;
        streamingAssetsUrl?: string;
        companyName?: string;
        productName?: string;
        productVersion?: string;
      },
      onProgress?: (progress: number) => void
    ) => Promise<any>;
  }
}

const UnityGame: React.FC<UnityGameProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [unityInstance, setUnityInstance] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isGameLoaded, setIsGameLoaded] = useState(false);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod'];
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const hasTouchSupport = 'ontouchstart' in window;
      const isSmallScreen = window.innerWidth <= 768;
      
      // 更严格的移动端检测：必须有触摸支持或者是移动端UserAgent
      return isMobileUserAgent || (hasTouchSupport && isSmallScreen);
    };
    
    const mobile = checkMobile();
    setIsMobile(mobile);
    
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod'];
    console.log('Mobile device detection result:', { 
      mobile, 
      userAgent: navigator.userAgent.toLowerCase(),
      isMobileUserAgent: mobileKeywords.some(keyword => navigator.userAgent.toLowerCase().includes(keyword)),
      hasTouch: 'ontouchstart' in window,
      isSmallScreen: window.innerWidth <= 768,
      windowWidth: window.innerWidth 
    });
    
    // Listen for window size changes
    const handleResize = () => {
      const newMobile = checkMobile();
      setIsMobile(newMobile);
      console.log('Window size changed - mobile status:', newMobile);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // 全屏状态监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Unity Canvas resize when fullscreen changes
  useEffect(() => {
    if (!unityInstance || !canvasRef.current) return;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isFullscreen) {
        // Fullscreen: use full viewport dimensions and ensure canvas fills entire screen
        if (isMobile) {
          // 移动端：填充整个屏幕
          canvas.style.width = '100vw';
          canvas.style.height = '100vh';
          canvas.style.maxWidth = 'none';
          canvas.style.maxHeight = 'none';
          canvas.style.objectFit = 'fill'; // 移动端完全填充
        } else {
          // 桌面端：保持比例的同时尽可能大
          canvas.style.width = '100vw';
          canvas.style.height = '100vh';
          canvas.style.maxWidth = 'none';
          canvas.style.maxHeight = 'none';
          canvas.style.objectFit = 'contain'; // 桌面端保持比例
        }
        canvas.style.position = 'static';  // 重置positioning，让容器处理定位
        console.log('Unity canvas resized for fullscreen:', { 
          width: '100vw', 
          height: '100vh',
          isMobile,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`
        });
      } else {
        // Normal mode: restore original dimensions
        if (isMobile) {
          // 移动端：保持适当大小，不要太小
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const gameAspectRatio = 960 / 600; // 游戏原始比例
          
          // 使用视口宽度的90%作为基准，确保游戏不会太小
          const targetWidth = Math.min(viewportWidth * 0.9, 960);
          const targetHeight = targetWidth / gameAspectRatio;
          
          // 如果高度超过视口的70%，则调整为视口高度的70%
          const maxHeight = viewportHeight * 0.7;
          if (targetHeight > maxHeight) {
            const adjustedHeight = maxHeight;
            const adjustedWidth = adjustedHeight * gameAspectRatio;
            canvas.style.width = `${adjustedWidth}px`;
            canvas.style.height = `${adjustedHeight}px`;
          } else {
            canvas.style.width = `${targetWidth}px`;
            canvas.style.height = `${targetHeight}px`;
          }
          
          canvas.style.maxWidth = '90vw';
          canvas.style.maxHeight = '70vh';
          
          console.log('Mobile canvas sizing:', {
            viewportSize: `${viewportWidth}x${viewportHeight}`,
            canvasSize: `${canvas.style.width} x ${canvas.style.height}`,
            targetSize: `${targetWidth}x${targetHeight}`
          });
        } else {
          canvas.style.width = '960px';
          canvas.style.height = '600px';
          canvas.style.maxWidth = '960px';
          canvas.style.maxHeight = '600px';
        }
        canvas.style.objectFit = 'contain'; // 保持比例
        canvas.style.position = 'static';  // 重置positioning
        console.log('Unity canvas resized for normal mode');
      }

      // Force canvas reflow
      void canvas.offsetHeight;
      
      // Notify Unity about canvas size change if possible
      try {
        if ((window as any).unityGameInstance && (window as any).unityGameInstance.Module) {
          (window as any).unityGameInstance.Module.setCanvasSize(
            canvas.clientWidth, 
            canvas.clientHeight
          );
        }
      } catch (err) {
        console.warn('Could not notify Unity about canvas resize:', err);
      }
    };

    // Delay resize to ensure DOM updates are complete
    const timeoutId = setTimeout(resizeCanvas, 100);
    return () => clearTimeout(timeoutId);
  }, [isFullscreen, isMobile, unityInstance]);

  // 全屏功能
  const enterFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (isMobile) {
        // 移动端：先锁定屏幕方向为横屏
        if ('screen' in window && 'orientation' in window.screen) {
          try {
            await (window.screen.orientation as any).lock('landscape');
          } catch (err) {
            console.warn('Could not lock screen orientation:', err);
          }
        }
      }
      
      // 进入全屏
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, [isMobile]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
  }, []);

  // ESC key to exit fullscreen (PC only)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, exitFullscreen]);

  // Mobile orientation change detection - auto fullscreen/exit based on orientation
  useEffect(() => {
    if (!isMobile) return;

    const checkAndHandleOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const aspectRatio = window.innerWidth / window.innerHeight;
      
      console.log('Mobile orientation check:', { 
        isLandscape, 
        isFullscreen, 
        width: window.innerWidth, 
        height: window.innerHeight,
        aspectRatio: aspectRatio.toFixed(2),
        unityLoaded: !!unityInstance,
        isGameLoaded,
        currentFullscreenElement: !!document.fullscreenElement
      });
      
      // 只有在游戏已加载且有明确的横屏状态时才执行自动全屏
      // aspectRatio > 1.2 确保是真正的横屏，避免正方形屏幕的误判
      if (isLandscape && aspectRatio > 1.2 && !isFullscreen && unityInstance && isGameLoaded) {
        console.log('Mobile landscape detected, auto entering fullscreen');
        enterFullscreen();
      } else if (!isLandscape && isFullscreen) {
        console.log('Mobile portrait detected, auto exiting fullscreen');
        exitFullscreen();
      }
    };

    const handleOrientationChange = () => {
      setTimeout(checkAndHandleOrientation, 300);
    };

    // 初始检测 - 当游戏加载完成后立即检查方向
    if (unityInstance && isGameLoaded) {
      setTimeout(checkAndHandleOrientation, 500);
    }

    // Monitor orientation changes for mobile auto-fullscreen
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isMobile, isFullscreen, unityInstance, isGameLoaded, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    let isMounted = true;

    const loadUnityGame = async () => {
      // 防止重复加载的守卫条件
      if (!canvasRef.current || isGameLoaded || unityInstance) {
        console.log('Skipping Unity game load:', { 
          canvasAvailable: !!canvasRef.current, 
          isGameLoaded, 
          unityInstanceExists: !!unityInstance 
        });
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        setLoadingProgress(0);

        // 动态加载Unity loader脚本
        const loaderScript = document.createElement('script');
        loaderScript.src = '/games/Build/RayChengSuperHexagonWebGL.loader.js';
        
        loaderScript.onload = async () => {
          if (!isMounted || !canvasRef.current) return;

          try {
            if (!window.createUnityInstance) {
              throw new Error('Unity loader not available');
            }

            const config = {
              dataUrl: '/games/Build/RayChengSuperHexagonWebGL.data',
              frameworkUrl: '/games/Build/RayChengSuperHexagonWebGL.framework.js',
              codeUrl: '/games/Build/RayChengSuperHexagonWebGL.wasm',
              streamingAssetsUrl: 'StreamingAssets',
              companyName: 'RayCheng',
              productName: 'Super Hexagon',
              productVersion: '1.0',
              // WebGL 特定配置
              matchWebGLToCanvasSize: true,
              devicePixelRatio: 1,
            };

            const instance = await window.createUnityInstance(
              canvasRef.current,
              config,
              (progress: number) => {
                if (isMounted) {
                  setLoadingProgress(Math.round(progress * 100));
                }
              }
            );

            if (isMounted) {
              setUnityInstance(instance);
              setIsGameLoaded(true);
              setIsLoading(false);
              console.log('Unity game loaded successfully');
              
              // Store instance for resizing
              (window as any).unityGameInstance = instance;
            }
          } catch (err) {
            if (isMounted) {
              console.error('Failed to load Unity game:', err);
              setError(`Failed to load game: ${err instanceof Error ? err.message : 'Unknown error'}`);
              setIsLoading(false);
            }
          }
        };

        loaderScript.onerror = () => {
          if (isMounted) {
            setError('Failed to load Unity loader script');
            setIsLoading(false);
          }
        };

        document.head.appendChild(loaderScript);

        // 清理函数
        return () => {
          if (loaderScript.parentNode) {
            loaderScript.parentNode.removeChild(loaderScript);
          }
        };
      } catch (err) {
        if (isMounted) {
          console.error('Error setting up Unity game:', err);
          setError(`Setup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };

    // 延迟加载以确保DOM已准备好
    const timeoutId = setTimeout(loadUnityGame, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      
      // 清理Unity实例
      if (unityInstance && unityInstance.quit) {
        try {
          unityInstance.quit();
          console.log('Unity instance cleaned up successfully');
        } catch (err) {
          console.warn('Error quitting Unity instance:', err);
        }
      }
      
      // 清理全局实例引用
      if ((window as any).unityGameInstance) {
        (window as any).unityGameInstance = null;
      }
    };
  }, []); // 只在组件挂载时运行一次

  const handleRetry = () => {
    // 清理当前状态
    setError('');
    setLoadingProgress(0);
    setIsGameLoaded(false);
    setUnityInstance(null);
    
    // 清理全局Unity实例
    if ((window as any).unityGameInstance) {
      try {
        (window as any).unityGameInstance.quit();
      } catch (err) {
        console.warn('Error quitting Unity instance during retry:', err);
      }
      (window as any).unityGameInstance = null;
    }
    
    // 重新加载页面作为最后手段
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div 
      className={`unity-game-container ${className || ''}`}
      style={{
        width: '100%',
        maxWidth: '1024px',
        margin: '0 auto',
        textAlign: 'center'
      }}
    >
      {error && (
        <div style={{
          background: '#ff4444',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>❌ Game Loading Failed</h3>
          <p>{error}</p>
          <button 
            onClick={handleRetry}
            style={{
              background: '#fff',
              color: '#ff4444',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{
          background: '#333',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>🎮 Loading Game...</h3>
          <div style={{
            background: '#555',
            height: '20px',
            borderRadius: '10px',
            overflow: 'hidden',
            margin: '10px 0'
          }}>
            <div style={{
              background: '#4CAF50',
              height: '100%',
              width: `${loadingProgress}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p>{loadingProgress}%</p>
        </div>
      )}

      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: isMobile ? '100%' : '960px',
          margin: '0 auto',
          padding: isMobile && !isFullscreen ? '0 10px' : '0',
          // 全屏时的样式
          ...(isFullscreen && {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: 'none',
            margin: 0,
            padding: 0,
            background: '#000',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            // 确保容器完全覆盖视口
            boxSizing: 'border-box'
          })
        }}
      >
        {/* 全屏按钮 - 仅桌面端显示 */}
        {!error && !isMobile && (
          <button
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10000,
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              minWidth: '60px',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.95)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={isFullscreen ? 'Exit Fullscreen (ESC or Click)' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '❌' : '⛶'}
            {isFullscreen ? 'Exit' : 'Full'}
          </button>
        )}

        <canvas 
          ref={canvasRef}
          id="unity-canvas"
          style={{
            // Mobile portrait: fit to screen width, maintain aspect ratio
            // Mobile landscape: true fullscreen
            // Desktop: fixed size or fullscreen
            width: isFullscreen 
              ? '100vw'  // Always use viewport width for fullscreen
              : (isMobile ? '90vw' : '960px'),  // 移动端使用90%视口宽度
            height: isFullscreen 
              ? '100vh'  // Always use viewport height for fullscreen
              : (isMobile ? 'auto' : '600px'),
            maxWidth: isFullscreen 
              ? 'none' 
              : (isMobile ? '90vw' : '960px'),  // 移动端限制最大宽度
            maxHeight: isFullscreen 
              ? 'none' 
              : (isMobile ? '70vh' : '600px'),  // 移动端限制最大高度为70%视口
            background: '#231F20',
            display: error ? 'none' : 'block',
            border: isFullscreen ? 'none' : '1px solid #444',
            // 确保Canvas不被缩放，保持1:1像素比
            imageRendering: 'pixelated',
            // 防止浏览器默认的触摸行为
            touchAction: 'none',
            userSelect: 'none',
            // 全屏时填充整个屏幕
            ...(isFullscreen && {
              width: '100vw',
              height: '100vh',
              maxWidth: 'none',
              maxHeight: 'none',
              objectFit: isMobile ? 'fill' : 'contain'  // 移动端填充，桌面端保持比例
            })
          }}
          width={960}
          height={600}
        />

        {/* 全屏时的说明文字 */}
        {isFullscreen && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '16px' : '14px',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: isMobile ? '10px 20px' : '8px 16px',
            borderRadius: '20px',
            pointerEvents: 'none'
          }}>
            {isMobile ? 'Rotate device to portrait to exit fullscreen' : 'Press ESC key or click top-right button to exit fullscreen'}
          </div>
        )}
      </div>

      {!isLoading && !error && !unityInstance && (
        <div style={{
          background: '#333',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h3>🎮 Preparing Game</h3>
          <p>Unity WebGL game will start soon...</p>
          {isMobile && (
            <p style={{ fontSize: '14px', color: '#aaa', marginTop: '10px' }}>
              💡 Tip: Rotate to landscape for automatic fullscreen mode
            </p>
          )}
        </div>
      )}

      {/* Mobile Tips */}
      {isMobile && !isLoading && !error && unityInstance && !isFullscreen && (
        <div style={{
          background: 'rgba(0, 123, 255, 0.1)',
          border: '1px solid rgba(0, 123, 255, 0.3)',
          color: '#007bff',
          padding: '15px',
          borderRadius: '8px',
          margin: '15px 0',
          fontSize: '14px'
        }}>
          📱 <strong>Mobile Tip:</strong> Rotate to landscape for automatic fullscreen mode and best gaming experience
        </div>
      )}


    </div>
  );
};

export default UnityGame;
