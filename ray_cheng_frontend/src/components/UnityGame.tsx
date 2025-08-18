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

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
             'ontouchstart' in window || 
             window.innerWidth <= 768;
    };
    
    setIsMobile(checkMobile());
    
    // 监听窗口大小变化
    const handleResize = () => {
      setIsMobile(checkMobile());
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

  // ESC键和双击退出全屏
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    const handleDoubleClick = (event: MouseEvent) => {
      if (isFullscreen && event.target === canvasRef.current) {
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    if (canvasRef.current) {
      canvasRef.current.addEventListener('dblclick', handleDoubleClick);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('dblclick', handleDoubleClick);
      }
    };
  }, [isFullscreen, exitFullscreen]);

  useEffect(() => {
    let isMounted = true;

    const loadUnityGame = async () => {
      if (!canvasRef.current) {
        console.error('Canvas ref is not available');
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
              setIsLoading(false);
              console.log('Unity game loaded successfully');
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
        } catch (err) {
          console.warn('Error quitting Unity instance:', err);
        }
      }
    };
  }, []);

  const handleRetry = () => {
    setError('');
    setLoadingProgress(0);
    // 重新加载组件
    window.location.reload();
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
          <h3>❌ 游戏加载失败</h3>
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
            重试
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
          <h3>🎮 正在加载游戏...</h3>
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
          maxWidth: '960px',
          margin: '0 auto',
          // 全屏时的样式
          ...(isFullscreen && {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: 'none',
            margin: 0,
            background: '#000',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          })
        }}
      >
        {/* 全屏按钮 */}
        {!isLoading && !error && unityInstance && (
          <button
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10000,
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'background 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
            }}
            title={isFullscreen ? 'Exit Fullscreen (ESC or Double-click)' : `Enter Fullscreen ${isMobile ? '(Landscape)' : ''}`}
          >
            {isFullscreen ? '⚫' : '⚪'}
            {isFullscreen ? 'Exit' : 'Full'}
            {isMobile && !isFullscreen && ' 🔄'}
          </button>
        )}

        <canvas 
          ref={canvasRef}
          id="unity-canvas"
          style={{
            width: isFullscreen ? (isMobile ? '100vh' : '100vw') : '960px',
            height: isFullscreen ? (isMobile ? '100vw' : '100vh') : '600px',
            maxWidth: isFullscreen ? 'none' : '960px',
            maxHeight: isFullscreen ? 'none' : '600px',
            background: '#231F20',
            display: error ? 'none' : 'block',
            border: isFullscreen ? 'none' : '1px solid #444',
            // 确保Canvas不被缩放，保持1:1像素比
            imageRendering: 'pixelated',
            // 防止浏览器默认的触摸行为
            touchAction: 'none',
            userSelect: 'none',
            // 全屏时居中
            ...(isFullscreen && {
              objectFit: 'contain'
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
            fontSize: '14px',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '8px 16px',
            borderRadius: '20px',
            pointerEvents: 'none'
          }}>
            Press ESC or Double-click to exit fullscreen
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
          <h3>🎮 准备加载游戏</h3>
          <p>Unity WebGL游戏即将开始...</p>
        </div>
      )}
    </div>
  );
};

export default UnityGame;
