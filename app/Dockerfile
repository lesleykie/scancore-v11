# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/i18n.js ./

# Create necessary directories
RUN mkdir -p modules public/uploads config i18n logs

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Set permissions for directories that need write access
RUN chown -R nextjs:nodejs /app/modules && \
    chown -R nextjs:nodejs /app/public/uploads && \
    chown -R nextjs:nodejs /app/config && \
    chown -R nextjs:nodejs /app/i18n && \
    chown -R nextjs:nodejs /app/logs

# Switch to non-root user
USER nextjs

# Start the application
CMD ["npm", "start"]
