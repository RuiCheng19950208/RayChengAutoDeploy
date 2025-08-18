import React, { useEffect, useRef, useState, useCallback } from 'react';

// 添加CSS动画样式
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .immersive-fullscreen-container {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
`;

if (!document.head.querySelector('style[data-unity-game-styles]')) {
  styleSheet.setAttribute('data-unity-game-styles', 'true');
  document.head.appendChild(styleSheet);
}

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
  const [canvasResolution, setCanvasResolution] = useState({ width: 960, height: 600 });
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // 添加调试信息到屏幕显示
  const addDebugInfo = (message: string) => {
    console.log(message); // 同时输出到控制台
    setDebugInfo(prev => {
      const newInfo = [...prev, `${new Date().toLocaleTimeString()}: ${message}`];
      return newInfo.slice(-10); // 只保留最新的10条信息
    });
  };

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

  // 沉浸式全屏效果：禁用页面滚动、锁定视角
  useEffect(() => {
    if (isFullscreen && isMobile) {
      // 保存原始body样式
      const originalBodyStyle = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        width: document.body.style.width,
        height: document.body.style.height,
        touchAction: document.body.style.touchAction,
        userSelect: document.body.style.userSelect
      };

      // 设置沉浸式全屏样式
      document.body.style.overflow = 'hidden'; // 禁止滚动
      document.body.style.position = 'fixed'; // 固定位置，防止地址栏影响
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
      document.body.style.touchAction = 'none'; // 禁用触摸手势
      document.body.style.userSelect = 'none'; // 禁用文本选择

      // 禁用页面缩放
      const viewport = document.querySelector('meta[name="viewport"]');
      const originalViewport = viewport?.getAttribute('content') || '';
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }

      // 阻止默认的触摸事件
      const preventDefaultTouch = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault(); // 防止多点触控缩放
        }
      };

      const preventScroll = (e: Event) => {
        e.preventDefault();
      };

      // 添加事件监听器
      document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
      document.addEventListener('gesturestart', preventScroll, { passive: false });
      document.addEventListener('gesturechange', preventScroll, { passive: false });
      document.addEventListener('gestureend', preventScroll, { passive: false });
      
      console.log('Immersive fullscreen mode activated');

      return () => {
        // 恢复原始样式
        document.body.style.overflow = originalBodyStyle.overflow;
        document.body.style.position = originalBodyStyle.position;
        document.body.style.width = originalBodyStyle.width;
        document.body.style.height = originalBodyStyle.height;
        document.body.style.touchAction = originalBodyStyle.touchAction;
        document.body.style.userSelect = originalBodyStyle.userSelect;

        // 恢复viewport设置
        if (viewport && originalViewport) {
          viewport.setAttribute('content', originalViewport);
        }

        // 移除事件监听器
        document.removeEventListener('touchmove', preventDefaultTouch);
        document.removeEventListener('gesturestart', preventScroll);
        document.removeEventListener('gesturechange', preventScroll);
        document.removeEventListener('gestureend', preventScroll);
        
        console.log('Immersive fullscreen mode deactivated');
      };
    }
  }, [isFullscreen, isMobile]);

  // Unity Canvas resize when fullscreen changes
  useEffect(() => {
    if (!unityInstance || !canvasRef.current) {
      addDebugInfo(`❌ resizeCanvas条件不满足: Unity:${!!unityInstance} Canvas:${!!canvasRef.current}`);
      return;
    }

    const resizeCanvas = () => {
      addDebugInfo(`🔥 resizeCanvas被调用! 全屏:${isFullscreen} 移动端:${isMobile} Unity:${!!unityInstance}`);
      
      const canvas = canvasRef.current;
      if (!canvas) {
        addDebugInfo(`❌ Canvas不存在，退出resizeCanvas`);
        return;
      }
      
      // 添加执行路径跟踪
      addDebugInfo(`📍 开始分辨率设置流程`);
      addDebugInfo(`📍 window.innerWidth:${window.innerWidth} innerHeight:${window.innerHeight}`);

      if (isFullscreen) {
        // 获取设备的实际物理屏幕分辨率
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // 获取真实的物理屏幕分辨率
        // eslint-disable-next-line no-restricted-globals
        const cssScreenWidth = screen.width;
        // eslint-disable-next-line no-restricted-globals
        const cssScreenHeight = screen.height;
        
        // 计算真实物理分辨率 = CSS尺寸 × devicePixelRatio
        const physicalScreenWidth = cssScreenWidth * devicePixelRatio;
        const physicalScreenHeight = cssScreenHeight * devicePixelRatio;
        
        console.log('📐 真实屏幕分辨率检测:', {
          '📱 CSS逻辑像素 (screen.*)': `${cssScreenWidth}×${cssScreenHeight}`,
          '🔍 Device Pixel Ratio': devicePixelRatio,
          '🖥️ 真实物理分辨率': `${physicalScreenWidth}×${physicalScreenHeight}`,
          '🌐 浏览器视口 (window.inner*)': `${window.innerWidth}×${window.innerHeight}`,
          '🎯 用于计算': `${physicalScreenWidth}×${physicalScreenHeight} (真实物理分辨率)`
        });
        
        // 关键修复：全屏时使用真实屏幕分辨率，非全屏时使用CSS逻辑像素
        let screenWidth, screenHeight;
        
        if (isFullscreen) {
          // 全屏时：强制使用真实的高分辨率
          // 方案1：尝试获取screen.availWidth/Height（可用屏幕分辨率）
          let availWidth = window.screen.availWidth || window.screen.width;
          let availHeight = window.screen.availHeight || window.screen.height;
          
          // 方案2：使用物理分辨率
          let physWidth = physicalScreenWidth;
          let physHeight = physicalScreenHeight;
          
          // 选择更大的分辨率值
          const candidate1 = Math.max(availWidth, availHeight);
          const candidate2 = Math.max(physWidth, physHeight);
          
          if (candidate2 > candidate1) {
            screenWidth = physWidth;
            screenHeight = physHeight;
            addDebugInfo(`🔧 选择物理分辨率: ${screenWidth}×${screenHeight} (${candidate2} > ${candidate1})`);
          } else {
            screenWidth = availWidth;
            screenHeight = availHeight;
            addDebugInfo(`🔧 选择可用分辨率: ${screenWidth}×${screenHeight} (${candidate1} >= ${candidate2})`);
          }
          
          // 确保横屏方向正确：宽度应该大于高度
          if (screenWidth < screenHeight) {
            const temp = screenWidth;
            screenWidth = screenHeight;
            screenHeight = temp;
            addDebugInfo(`🔄 调整为横屏方向: ${screenWidth}×${screenHeight}`);
          }
        } else {
          // 非全屏时：使用CSS逻辑像素
          screenWidth = cssScreenWidth;
          screenHeight = cssScreenHeight;
          addDebugInfo(`🔧 非全屏模式，使用CSS逻辑像素: ${screenWidth}×${screenHeight}`);
        }
        
        // 物理分辨率仅用于日志显示
        // const actualWidth = Math.floor(screenWidth * devicePixelRatio);
        // const actualHeight = Math.floor(screenHeight * devicePixelRatio);

        addDebugInfo(`📍 准备进入分支判断: isMobile=${isMobile}`);
        
        if (isMobile) {
          addDebugInfo(`📍 进入移动端分支`);
          // 移动端：保持游戏原始宽高比，避免UI变形
          const isLandscape = screenWidth > screenHeight;
          
          // 游戏的标准宽高比 - 尝试不同的比例看哪个效果更好
          // const gameAspectRatio = 16 / 9;  // 1.778 (标准横屏)
          // const gameAspectRatio = 16 / 10; // 1.6 (宽屏显示器常用)
          const gameAspectRatio = 3 / 2;     // 1.5 (可能更适合您的游戏)
          // const gameAspectRatio = 4 / 3;   // 1.333 (传统屏幕比例)
          
          const deviceAspectRatio = screenWidth / screenHeight;
          
          console.log(`🚨 调试信息 - 分辨率设置前:`, {
            cssScreenSize: `${cssScreenWidth}×${cssScreenHeight}`,
            physicalScreenSize: `${physicalScreenWidth}×${physicalScreenHeight}`,
            devicePixelRatio: devicePixelRatio,
            screenWidthUsed: screenWidth,
            screenHeightUsed: screenHeight,
            isLandscape: screenWidth > screenHeight,
            currentCanvasSize: `${canvasRef.current?.width || 'unknown'}×${canvasRef.current?.height || 'unknown'}`
          });
          
          addDebugInfo(`📐 屏幕尺寸: ${screenWidth}×${screenHeight} 宽高比:${deviceAspectRatio.toFixed(2)}`);
          
          // 高质量基准分辨率
          const baseWidth = 1920;
          const baseHeight = 1080;
          
          // 多设备适配策略：获取真实的全屏显示能力
          const cssDisplayWidth = window.innerWidth;   
          const cssDisplayHeight = window.innerHeight; 
          const physicalDisplayWidth = cssDisplayWidth * devicePixelRatio;
          const physicalDisplayHeight = cssDisplayHeight * devicePixelRatio;
          
          addDebugInfo(`🔧 CSS显示: ${cssDisplayWidth}×${cssDisplayHeight}, 物理显示: ${physicalDisplayWidth}×${physicalDisplayHeight}`);
          
          // 在全屏时，我们应该利用设备的真实显示能力
          let effectiveDisplayWidth, effectiveDisplayHeight;
          
          if (isFullscreen) {
            // 全屏时：使用物理显示能力，但限制在合理范围内
            const maxWidth = 1920;
            const maxHeight = 1080;
            
            // 按比例缩放物理分辨率到合理范围
            const physicalRatio = physicalDisplayWidth / physicalDisplayHeight;
            const targetRatio = Math.min(physicalRatio, 16/9); // 限制最大宽高比
            
            if (physicalDisplayWidth > maxWidth || physicalDisplayHeight > maxHeight) {
              // 物理分辨率太高，按比例缩小到最大限制
              const scaleX = maxWidth / physicalDisplayWidth;
              const scaleY = maxHeight / physicalDisplayHeight;
              const scale = Math.min(scaleX, scaleY);
              
              effectiveDisplayWidth = Math.floor(physicalDisplayWidth * scale);
              effectiveDisplayHeight = Math.floor(physicalDisplayHeight * scale);
              addDebugInfo(`🔧 物理分辨率过高，缩放到: ${effectiveDisplayWidth}×${effectiveDisplayHeight}`);
            } else {
              // 物理分辨率合理，直接使用
              effectiveDisplayWidth = physicalDisplayWidth;
              effectiveDisplayHeight = physicalDisplayHeight;
              addDebugInfo(`🔧 使用物理分辨率: ${effectiveDisplayWidth}×${effectiveDisplayHeight}`);
            }
          } else {
            // 非全屏时：使用CSS显示尺寸
            effectiveDisplayWidth = cssDisplayWidth;
            effectiveDisplayHeight = cssDisplayHeight;
            addDebugInfo(`🔧 非全屏使用CSS尺寸: ${effectiveDisplayWidth}×${effectiveDisplayHeight}`);
          }
          
          const displayWidth = effectiveDisplayWidth;
          const displayHeight = effectiveDisplayHeight;
          
          // 智能分辨率策略：根据显示尺寸选择最优Canvas分辨率
          let targetWidth, targetHeight;
          
          if (isFullscreen) {
            // 全屏模式：使用标准游戏分辨率，按比例适配
            const gameResolutions = [
              { width: 1920, height: 1080, name: "1080p" },
              { width: 1280, height: 720,  name: "720p" },
              { width: 960,  height: 540,  name: "540p" },
              { width: 640,  height: 360,  name: "360p" }
            ];
            
            // 选择最接近显示尺寸但不超过的分辨率
            let selectedRes = gameResolutions[gameResolutions.length - 1]; // 默认最低分辨率
            
            for (const res of gameResolutions) {
              if (res.width <= displayWidth * 1.5 && res.height <= displayHeight * 1.5) {
                selectedRes = res;
                break;
              }
            }
            
            targetWidth = selectedRes.width;
            targetHeight = selectedRes.height;
            
            addDebugInfo(`🎮 选择${selectedRes.name}分辨率: ${targetWidth}×${targetHeight}`);
            
            // 如果选择的分辨率宽高比与显示区域差异太大，按比例调整
            const gameRatio = targetWidth / targetHeight;
            const displayRatio = displayWidth / displayHeight;
            
            if (Math.abs(gameRatio - displayRatio) > 0.3) {
              if (displayRatio > gameRatio) {
                // 显示更宽，以高度为准
                targetWidth = Math.floor(targetHeight * displayRatio);
              } else {
                // 显示更高，以宽度为准
                targetHeight = Math.floor(targetWidth / displayRatio);
              }
              addDebugInfo(`🔄 比例调整: ${targetWidth}×${targetHeight} (匹配显示比例${displayRatio.toFixed(2)})`);
            }
          } else {
            // 非全屏模式：直接基于显示尺寸，适度提升质量
            const scale = Math.min(1.5, devicePixelRatio); // 最多1.5倍
            targetWidth = Math.floor(displayWidth * scale);
            targetHeight = Math.floor(displayHeight * scale);
            addDebugInfo(`📱 非全屏: ${displayWidth}×${displayHeight} → ${targetWidth}×${targetHeight} (${scale}x)`);
          }
          
          console.log(`📊 最终计算结果:`, {
            orientation: isLandscape ? 'Landscape' : 'Portrait',
            inputScreen: `${screenWidth}×${screenHeight}`,
            outputCanvas: `${targetWidth}×${targetHeight}`,
            canvasAspectRatio: (targetWidth / targetHeight).toFixed(3),
            shouldMatchGame: gameAspectRatio.toFixed(3)
          });
          
          // 确保不超过设备能力和性能限制
          const maxPixels = 2560 * 1440; // 最大像素数限制
          const currentPixels = targetWidth * targetHeight;
          
          if (currentPixels > maxPixels) {
            const scale = Math.sqrt(maxPixels / currentPixels);
            targetWidth = Math.floor(targetWidth * scale);
            targetHeight = Math.floor(targetHeight * scale);
          }
          
          console.log(`📱 Mobile ${isLandscape ? 'Landscape' : 'Portrait'} mode: Using aspect-corrected ${targetWidth}×${targetHeight}`);
          
          // 关键：设置Canvas内部分辨率
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // 立即验证设置是否生效
          const settingSuccess = canvas.width === targetWidth && canvas.height === targetHeight;
          addDebugInfo(`🚨 Canvas设置: 目标${targetWidth}×${targetHeight} 实际${canvas.width}×${canvas.height} 成功:${settingSuccess}`);
          
          // 移动端：移除所有样式设置，完全交给inline样式管理
          // 避免resizeCanvas与inline样式的冲突，这是分辨率问题的根源
          
          // 更新状态
          setCanvasResolution({ width: targetWidth, height: targetHeight });
          
          console.log('🎮 Mobile fullscreen - Multi-Device Strategy:', {
            '📱 CSS显示区域': `${displayWidth}×${displayHeight}`,
            '🔍 Device Pixel Ratio': devicePixelRatio,
            '🎯 选择的Canvas分辨率': `${targetWidth}×${targetHeight}`,
            '📊 分辨率比例': `${(targetWidth/displayWidth).toFixed(2)}x 显示宽度`,
            '📐 显示区域宽高比': (displayWidth/displayHeight).toFixed(3),
            '🎮 Canvas宽高比': (targetWidth/targetHeight).toFixed(3),
            '✅ 多设备适配': '智能选择合适的游戏分辨率',
            '🎨 预期效果': '适合当前设备的完整游戏画面'
          });
          
          // 性能和质量指标
          const pixelCount = targetWidth * targetHeight;
          const megaPixels = (pixelCount / 1000000).toFixed(2);
          console.log(`🚀 Game rendering: ${pixelCount.toLocaleString()} pixels (${megaPixels}MP 全高清质量)`);
          
          // 移动端Unity覆盖检查
          const expectedWidth = targetWidth;
          const expectedHeight = targetHeight;
          setTimeout(() => {
            const currentWidth = canvas.width;
            const currentHeight = canvas.height;
            addDebugInfo(`🕐 Unity后检查: Canvas分辨率${currentWidth}×${currentHeight}`);
            
            // 如果Unity覆盖了我们的设置，强制重新设置
            if (isFullscreen && isMobile && (currentWidth !== expectedWidth || currentHeight !== expectedHeight)) {
              addDebugInfo(`🔧 Unity覆盖了分辨率，强制重新设置为${expectedWidth}×${expectedHeight}`);
              canvas.width = expectedWidth;
              canvas.height = expectedHeight;
              setCanvasResolution({ width: expectedWidth, height: expectedHeight });
              
              // 再次检查
              setTimeout(() => {
                addDebugInfo(`🔍 强制设置后检查: ${canvas.width}×${canvas.height}`);
              }, 50);
            }
          }, 200);
        } else {
          addDebugInfo(`📍 进入桌面端分支`);
          // 桌面端：固定使用1920×1080分辨率
          const targetWidth = 1920;
          const targetHeight = 1080;
          addDebugInfo(`🖥️ 桌面端固定分辨率: ${targetWidth}×${targetHeight}`);
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // 桌面端CSS样式设置 - 让Container处理定位，Canvas只负责填充
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.maxWidth = 'none';
          canvas.style.maxHeight = 'none';
          canvas.style.objectFit = 'contain'; // 桌面端保持比例，防止拉伸
          canvas.style.imageRendering = 'auto';
          canvas.style.padding = '0';
          canvas.style.margin = '0';
          canvas.style.boxSizing = 'content-box';
          canvas.style.display = 'block'; // 确保正常显示
          
          // 更新状态
          setCanvasResolution({ width: targetWidth, height: targetHeight });
          
          console.log('🖥️ Desktop fullscreen - Fixed Resolution Strategy:', {
            '📱 Physical Screen Size': `${screenWidth}×${screenHeight} CSS像素 (设备真实屏幕)`,
            '🔍 Device Pixel Ratio': devicePixelRatio,
            '📐 Physical Resolution': `${screenWidth * devicePixelRatio}×${screenHeight * devicePixelRatio} 物理像素`,
            '🎯 Game Render Resolution': `${targetWidth}×${targetHeight} (固定全高清质量)`,
            '✨ 分离策略': '游戏分辨率与屏幕尺寸完全独立'
          });
        }
      } else {
        // Normal mode: restore original dimensions
        if (isMobile) {
          // 移动端：简化尺寸计算，保持居中
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const gameAspectRatio = 960 / 600; // 游戏原始比例 16:10
          const isLandscapeMode = viewportWidth > viewportHeight;
          
          if (isLandscapeMode) {
            // 横屏模式：将由全屏模式处理，这里设置临时大小
            const containerWidth = viewportWidth - 20; // 留出边距
            const targetHeight = Math.min(viewportHeight * 0.8, containerWidth / gameAspectRatio);
            const targetWidth = targetHeight * gameAspectRatio;
            
            canvas.style.width = `${targetWidth}px`;
            canvas.style.height = `${targetHeight}px`;
          } else {
            // 竖屏模式：使用容器宽度的90%，保持比例
            const containerWidth = viewportWidth - 20; // 留出边距
            const targetWidth = Math.min(containerWidth * 0.9, 960);
            const targetHeight = targetWidth / gameAspectRatio;
            
            // 确保高度不超过视口的50%
            const maxHeight = viewportHeight * 0.5;
            if (targetHeight > maxHeight) {
              const adjustedHeight = maxHeight;
              const adjustedWidth = adjustedHeight * gameAspectRatio;
              canvas.style.width = `${adjustedWidth}px`;
              canvas.style.height = `${adjustedHeight}px`;
            } else {
              canvas.style.width = `${targetWidth}px`;
              canvas.style.height = `${targetHeight}px`;
            }
          }
          
          canvas.style.maxWidth = '100%';
          canvas.style.maxHeight = 'none';
          
          console.log('Mobile canvas sizing (simplified):', {
            viewportSize: `${viewportWidth}x${viewportHeight}`,
            isLandscape: isLandscapeMode,
            canvasSize: `${canvas.style.width} x ${canvas.style.height}`,
            containerWidth: viewportWidth - 20
          });
        } else {
          // 桌面端：恢复原始尺寸
          canvas.width = 960;
          canvas.height = 600;
          canvas.style.width = '960px';
          canvas.style.height = '600px';
          canvas.style.maxWidth = '960px';
          canvas.style.maxHeight = '600px';
        }
        canvas.style.objectFit = 'contain'; // 保持比例
        canvas.style.position = 'static';  // 重置positioning
        
        // 在非全屏模式下，恢复原始Canvas分辨率
        if (!canvas.width || canvas.width === 0) {
          canvas.width = 960;
          canvas.height = 600;
        }
        
        // 更新状态为原始分辨率
        setCanvasResolution({ width: 960, height: 600 });
        
        console.log('Unity canvas resized for normal mode:', {
          canvasSize: `${canvas.width}x${canvas.height}`,
          cssSize: `${canvas.style.width} x ${canvas.style.height}`
        });
      }

      // Force canvas reflow
      void canvas.offsetHeight;
      
      // 在通知Unity前检查Canvas分辨率是否正确设置
      console.log('🔍 通知Unity前的Canvas状态检查:', {
        Canvas内部分辨率: `${canvas.width}×${canvas.height}`,
        Canvas属性width: canvas.getAttribute('width'),
        Canvas属性height: canvas.getAttribute('height'),
        Unity实例: !!(window as any).unityGameInstance
      });
      
      // Notify Unity about canvas size change if possible
      try {
        if ((window as any).unityGameInstance) {
          // 通知Unity Canvas的内部分辨率变化
          if ((window as any).unityGameInstance.Module && (window as any).unityGameInstance.Module.setCanvasSize) {
            (window as any).unityGameInstance.Module.setCanvasSize(canvas.width, canvas.height);
            console.log('✅ 已通知Unity Module Canvas分辨率:', {
              width: canvas.width,
              height: canvas.height
            });
          }
          
          // 如果有sendMessage方法，也通知Unity游戏逻辑
          if ((window as any).unityGameInstance.SendMessage) {
            (window as any).unityGameInstance.SendMessage('Main Camera', 'OnResolutionChanged', `${canvas.width}x${canvas.height}`);
            console.log('✅ 已通知Unity游戏逻辑分辨率变化');
          }
        }
      } catch (err) {
        console.warn('❌ 通知Unity Canvas分辨率失败:', err);
      }
      
      // Unity覆盖检查已移到各分支内部
    };

    // Delay resize to ensure DOM updates are complete
    const timeoutId = setTimeout(resizeCanvas, 100);
    return () => clearTimeout(timeoutId);
  }, [isFullscreen, isMobile, unityInstance]);

  // 全屏功能
  const enterFullscreen = useCallback(async () => {
    addDebugInfo(`🚀 enterFullscreen被调用! 当前isFullscreen:${isFullscreen}`);
    
    if (!containerRef.current) {
      addDebugInfo(`❌ containerRef不存在，无法进入全屏`);
      return;
    }
    
    try {
      if (isMobile) {
        // 移动端：先锁定屏幕方向为横屏
        if ('screen' in window && 'orientation' in window.screen) {
          try {
            await (window.screen.orientation as any).lock('landscape-primary');
            console.log('Screen orientation locked to landscape');
          } catch (err) {
            console.warn('Could not lock screen orientation:', err);
            // 尝试备用方法
            try {
              await (window.screen.orientation as any).lock('landscape');
            } catch (fallbackErr) {
              console.warn('Fallback orientation lock also failed:', fallbackErr);
            }
          }
        }

        // 尝试进入沉浸式模式（隐藏地址栏等UI）
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        // 桌面端：直接进入全屏
        await containerRef.current.requestFullscreen();
      }
      
      setIsFullscreen(true);
      addDebugInfo(`✅ 全屏状态设置为true, 准备触发resizeCanvas`);
      console.log('Entered immersive fullscreen mode');
    } catch (err) {
      addDebugInfo(`❌ 进入全屏失败: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Failed to enter fullscreen:', err);
    }
  }, [isMobile]);

  const exitFullscreen = useCallback(async () => {
    try {
      // 先退出全屏模式
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      // 移动端：解锁屏幕方向
      if (isMobile && 'screen' in window && 'orientation' in window.screen) {
        try {
          await (window.screen.orientation as any).unlock();
          console.log('Screen orientation unlocked');
        } catch (err) {
          console.warn('Could not unlock screen orientation:', err);
        }
      }
      
      setIsFullscreen(false);
      console.log('Exited immersive fullscreen mode');
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
  }, [isMobile]);

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

  // Orientation change detection - auto fullscreen/exit based on orientation (for all devices)
  useEffect(() => {
    const checkAndHandleOrientation = () => {
        const isLandscape = window.innerWidth > window.innerHeight;
      const aspectRatio = window.innerWidth / window.innerHeight;
      const isSmallScreen = window.innerWidth <= 1024; // 扩大检测范围到平板尺寸

      addDebugInfo(`🔄 横屏检测: 横屏:${isLandscape} 比例:${aspectRatio.toFixed(2)} 移动端:${isMobile}`);
      addDebugInfo(`🔄 条件检查: 全屏:${isFullscreen} Unity:${!!unityInstance} 游戏加载:${isGameLoaded}`);
      
      console.log('Orientation check:', { 
          isLandscape, 
          isFullscreen, 
          width: window.innerWidth, 
          height: window.innerHeight,
        aspectRatio: aspectRatio.toFixed(2),
        isSmallScreen,
        isMobile,
          unityLoaded: !!unityInstance,
        isGameLoaded,
          currentFullscreenElement: !!document.fullscreenElement
        });
        
      // 移动端设备在横屏时自动全屏，竖屏时退出全屏
      if (isMobile) {
        if (isLandscape && aspectRatio > 1.1 && !isFullscreen && unityInstance && isGameLoaded) {
          addDebugInfo(`🚀 横屏触发自动全屏! 宽高比:${aspectRatio.toFixed(2)}`);
          console.log('Mobile landscape detected, auto entering fullscreen');
          enterFullscreen();
        } else if (!isLandscape && isFullscreen) {
          addDebugInfo(`📱 竖屏触发退出全屏`);
          console.log('Mobile portrait detected, auto exiting fullscreen');
          exitFullscreen();
        } else if (isLandscape) {
          addDebugInfo(`❌ 横屏但未触发全屏: 比例${aspectRatio.toFixed(2)}>1.1? ${aspectRatio > 1.1} 非全屏? ${!isFullscreen} Unity? ${!!unityInstance} 加载? ${isGameLoaded}`);
        }
      }
      // 其他小屏设备（平板等）的处理
      else if (isSmallScreen && isLandscape && aspectRatio > 1.2 && !isFullscreen && unityInstance && isGameLoaded) {
        console.log('Small screen landscape detected, auto entering fullscreen');
        enterFullscreen();
      }
    };

    const handleOrientationChange = () => {
      setTimeout(checkAndHandleOrientation, 300);
    };

    // 初始检测 - 当游戏加载完成后立即检查方向
    if (unityInstance && isGameLoaded) {
      setTimeout(checkAndHandleOrientation, 500);
    }
    
    // 页面加载时的初始检测（针对已经是横屏状态的情况）
    setTimeout(checkAndHandleOrientation, 1000);

    // Monitor orientation changes for auto-fullscreen (all devices)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时运行一次，isGameLoaded和unityInstance用于防重复加载守卫

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
        maxWidth: isMobile ? '100vw' : '1024px',
        margin: '0 auto',
        textAlign: 'center',
        padding: isMobile ? '0 10px' : '0 20px',
        boxSizing: 'border-box'
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
        className={isFullscreen && isMobile ? 'immersive-fullscreen-container' : ''}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: isMobile ? '100%' : '960px',
          margin: '0 auto',
          padding: '0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
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
            boxSizing: 'border-box',
            // 移动端沉浸式效果增强
            ...(isMobile && {
              animation: 'fadeIn 0.3s ease-in-out',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden'
            })
          })
        }}
      >
        {/* 全屏按钮 - 桌面端和大屏设备显示 */}
        {!error && (window.innerWidth > 1024 || !isMobile) && (
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
            // 基础样式
            background: '#231F20',
            display: error ? 'none' : 'block',
            touchAction: 'none',
            userSelect: 'none',
            
            // 非全屏模式
            ...(!isFullscreen && {
              width: isMobile ? '100%' : '960px',
              height: isMobile ? 'auto' : '600px',
              maxWidth: isMobile ? '100%' : '960px',
              border: '1px solid #444',
              margin: '0 auto',
              imageRendering: 'pixelated',
            }),
            
            // 全屏模式 - 移动端和桌面端分别处理
            ...(isFullscreen && {
              border: 'none',
              margin: 0,
              padding: 0,
              boxSizing: 'content-box',
              imageRendering: 'auto',
              
                            // 移动端：使用固定定位填充整个屏幕，但保持游戏宽高比
              ...(isMobile && {
                position: 'fixed',
              top: 0,
              left: 0,
                width: '100vw',
                height: '100vh',
                maxWidth: 'none',
                maxHeight: 'none',
                minWidth: '100vw',
                minHeight: '100vh',
                zIndex: 10000,
                objectFit: 'contain', // 关键修复：保持宽高比，避免UI变形
                // 使用支持检测的dvh
                ...(CSS.supports('height', '100dvh') && {
                  width: '100dvw',
                  height: '100dvh',
                  minWidth: '100dvw',
                  minHeight: '100dvh',
                }),
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
              }),
              
              // 桌面端：让Container居中，Canvas填充Container
              ...(!isMobile && {
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain', // 保持比例，避免拉伸
                display: 'block'
              })
            })
          }}
          width={canvasResolution.width}
          height={canvasResolution.height}
        />

        {/* 调试信息面板 - 移动端总是显示，帮助调试横屏自动全屏 */}
        {isMobile && debugInfo.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00ff00',
            fontSize: '10px',
            fontFamily: 'monospace',
            padding: '8px',
            borderRadius: '4px',
            maxHeight: '200px',
            overflow: 'auto',
            zIndex: 10002,
            pointerEvents: 'none'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔍 调试信息:</div>
            {debugInfo.map((info, index) => (
              <div key={index} style={{ marginBottom: '2px', fontSize: '9px' }}>
                {info}
              </div>
            ))}
          </div>
        )}

        {/* 全屏时的说明文字 */}
        {isFullscreen && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: isMobile ? '14px' : '14px',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: isMobile ? '12px 24px' : '8px 16px',
            borderRadius: '25px',
            pointerEvents: 'none',
            maxWidth: isMobile ? '80vw' : 'auto',
            lineHeight: '1.4',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {isMobile ? (
              <>
                🎮 <strong>沉浸式游戏模式已激活</strong><br/>
                旋转至竖屏可退出全屏
              </>
            ) : (
              'Press ESC key or click top-right button to exit fullscreen'
            )}
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

      {/* Mobile Tips and Manual Fullscreen Button */}
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
          
          {/* 手动全屏按钮 - 用于调试 */}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={enterFullscreen}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              🔍 手动进入全屏 (调试用)
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default UnityGame;
