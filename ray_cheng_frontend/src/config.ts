// 动态获取API基础URL，支持不同环境
const getApiBaseUrl = () => {
  // 如果设置了环境变量，优先使用
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // 在生产环境中，尝试自动检测后端URL
  if (process.env.NODE_ENV === 'production') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // 如果是部署在同一个域名下（比如 Render）
    if (hostname.includes('onrender.com') || hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
      // 假设后端也部署在相同的服务上，使用相对路径或同域名
      return `${protocol}//${hostname}/api`;
    }
  }
  
  // 在开发环境中，检测当前访问的主机
  if (process.env.NODE_ENV === 'development') {
    const hostname = window.location.hostname;
    
    // 如果是通过IP访问（比如 10.0.0.156），使用相同的IP访问后端
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8000/api`;
    }
  }
  
  // 默认回退到localhost
  return 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();


