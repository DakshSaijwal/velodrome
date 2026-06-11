/**
 * Global error handler — must be registered LAST in Express middleware chain.
 * Usage: app.use(errorHandler)
 */
export function errorHandler(err, req, res, next) {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
}
