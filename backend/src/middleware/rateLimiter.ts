import rateLimit from 'express-rate-limit';

/**
 * Session 创建限流中间件
 * 限制：每 IP 每 15 分钟最多创建 20 个 session
 * 防止恶意批量注册用户
 */
export const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMITED',
    message: 'Too many sessions created from this IP, please try again later.',
  },
});
